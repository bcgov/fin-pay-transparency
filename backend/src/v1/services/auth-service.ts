import axios from 'axios';
import {config} from '../../config';
import {logger as log} from '../../logger';
import jsonwebtoken from 'jsonwebtoken';
import qs from 'querystring';
import {utils} from './utils-service';
import HttpStatus from 'http-status-codes';
import prisma from "../prisma/prisma-client";
import {getCompanyDetails} from "../../external/services/bceid-service";

let kcPublicKey;
const auth = {
  // Check if JWT Access Token has expired
  isTokenExpired(token) {
    const now = Date.now().valueOf() / 1000;
    const payload = jsonwebtoken.decode(token);

    return (!!payload['exp'] && payload['exp'] < (now + 30)); // Add 30 seconds to make sure , edge case is avoided and token is refreshed.
  },

  // Check if JWT Refresh Token has expired
  isRenewable(token) {
    const now = Date.now().valueOf() / 1000;
    const payload = jsonwebtoken.decode(token);

    // Check if expiration exists, or lacks expiration

    return (typeof (payload.exp) !== 'undefined' && payload.exp !== null &&
      payload.exp === 0 || payload.exp > now);
  },

  // Get new JWT and Refresh tokens
  async renew(refreshToken) {
    let result: any = {};

    try {
      const discovery = await utils.getOidcDiscovery();
      const response = await axios.post(discovery.token_endpoint,
        qs.stringify({
          client_id: config.get('oidc:clientId'),
          client_secret: config.get('oidc:clientSecret'),
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: 'bceidbusiness'
        }), {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      log.verbose('renew', utils.prettyStringify(response.data));
      if (response.data?.access_token && response.data?.refresh_token) {
        result.jwt = response.data.access_token;
        result.refreshToken = response.data.refresh_token;
        result.idToken = response.data.id_token;
      } else {
        log.error('Access token or refresh token not retrieved properly');
      }
    } catch (error) {
      log.error('renew', error.message);
      result = error.response && error.response.data;
    }

    return result;
  },

  // Update or remove token based on JWT and user state
  async refreshJWT(req, _res, next) {
    try {
      if (req.user?.jwt) {
        log.verbose('refreshJWT', 'User & JWT exists');

        if (auth.isTokenExpired(req.user.jwt)) {
          log.verbose('refreshJWT', 'JWT has expired');

          if (!!req.user.refreshToken && auth.isRenewable(req.user.refreshToken)) {
            log.verbose('refreshJWT', 'Can refresh JWT token');

            // Get new JWT and Refresh Tokens and update the request
            const result: any = await auth.renew(req.user.refreshToken);
            req.user.jwt = result.jwt; // eslint-disable-line require-atomic-updates
            req.user.refreshToken = result.refreshToken; // eslint-disable-line require-atomic-updates
          } else {
            log.verbose('refreshJWT', 'Cannot refresh JWT token');
            delete req.user;
          }
        }
      } else {
        log.verbose('refreshJWT', 'No existing User or JWT');
        delete req.user;
      }
    } catch (error) {
      log.error('refreshJWT', error.message);
    }
    next();
  },

  generateUiToken() {
    const i = config.get('tokenGenerate:issuer');
    const s = 'user@finpaytransparency.ca';
    const a = config.get('server:frontend');
    const signOptions = {
      issuer: i,
      subject: s,
      audience: a,
      expiresIn: '30m',
      algorithm: 'RS256'
    };

    const privateKey = config.get('tokenGenerate:privateKey');
    const uiToken = jsonwebtoken.sign({}, privateKey, signOptions);
    log.verbose('Generated JWT', uiToken);
    return uiToken;
  },


  /**
   * check if the jwt contains valid claims.
   * The token should be issued by bceidbusiness and the audience should be the configured client id
   * Since the app is using the standard realm of Keycloak, this extra check is required to make sure other users are not able to get access.
   * https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-validate-the-idp-in-the-jwt
   * @param jwt the token
   */
  validateClaims: function (jwt) {
    const payload = jsonwebtoken.decode(jwt);
    if (!payload['identity_provider'] || payload['identity_provider'] !== 'bceidbusiness') {
      throw new Error('backend token invalid, identity_provider is not bceidbusiness', jwt);
    }
    if (!payload['aud'] || payload['aud'] !== config.get('oidc:clientId')) {
      throw new Error('backend token invalid, aud claim validation failed', jwt);
    }
    return true;
  },
  isValidBackendToken() {
    return async function (req, res, next) {
      if (!kcPublicKey) {
        kcPublicKey = await utils.getKeycloakPublicKey();
        if (!kcPublicKey) {
          log.error('error is from getKeycloakPublicKey');
          return res.status(HttpStatus.UNAUTHORIZED).json();
        }
      }
      if (req?.session?.passport?.user?.jwt) {
        const jwt = req.session.passport.user.jwt;
        try {
          jsonwebtoken.verify(jwt, kcPublicKey);
          auth.validateClaims(jwt);
          return next();
        } catch (e) {
          log.error('error is from verify', e);
          return res.status(HttpStatus.UNAUTHORIZED).json();
        }
      } else {
        log.silly(req.session);
        log.silly('no jwt responding back 401');
        return res.status(HttpStatus.UNAUTHORIZED).json();
      }
    };
  },
  async getUserInfo(req, res) {
    const userInfo = req?.session?.passport?.user;
    if (!userInfo?.jwt || !userInfo?._json) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'No session data'
      });
    }
    const userInfoFrontend = {
      displayName: userInfo._json.display_name,
      ...req.session.companyDetails
    };
    return res.status(HttpStatus.OK).json(userInfoFrontend);
  },

  createOrUpdatePayTransparencyCompany: async function (userInfo, req, tx) {
    const existing_pay_transparency_company = await tx.pay_transparency_company.findFirst({
      where: {
        bceid_business_guid: userInfo._json.bceid_business_guid,
      }
    });
    if (existing_pay_transparency_company) {
      existing_pay_transparency_company.update_date = new Date();
      existing_pay_transparency_company.company_name = req.session.companyDetails.legalName;
      existing_pay_transparency_company.address_line1 = req.session.companyDetails.addressLine1;
      existing_pay_transparency_company.address_line2 = req.session.companyDetails.addressLine2;
      existing_pay_transparency_company.city = req.session.companyDetails.city;
      existing_pay_transparency_company.province = req.session.companyDetails.province;
      existing_pay_transparency_company.country = req.session.companyDetails.country;
      existing_pay_transparency_company.postal_code = req.session.companyDetails.postal;
      await tx.pay_transparency_company.update({
        where: {
          company_id: existing_pay_transparency_company.company_id,
        },
        data: existing_pay_transparency_company
      });
    } else {
      await tx.pay_transparency_company.create({
        data: {
          bceid_business_guid: userInfo._json.bceid_business_guid,
          company_name: req.session.companyDetails.legalName,
          address_line1: req.session.companyDetails.addressLine1,
          address_line2: req.session.companyDetails.addressLine2,
          city: req.session.companyDetails.city,
          province: req.session.companyDetails.province,
          country: req.session.companyDetails.country,
          postal_code: req.session.companyDetails.postal,
          create_date: new Date(),
          update_date: new Date()
        }
      });
    }
  },
  createOrUpdatePayTransparencyUser: async function (userInfo, tx) {
    const existingPayTransparencyUser = await tx.pay_transparency_user.findFirst({
      where: {
        bceid_user_guid: userInfo._json.bceid_user_guid,
        bceid_business_guid: userInfo._json.bceid_business_guid
      }
    });
    if (existingPayTransparencyUser) {
      existingPayTransparencyUser.update_date = new Date();
      existingPayTransparencyUser.display_name = userInfo._json.display_name;
      await tx.pay_transparency_user.update({
        where: {
          user_id: existingPayTransparencyUser.user_id,
        },
        data: existingPayTransparencyUser
      });
    } else {
      await tx.pay_transparency_user.create({
        data: {
          bceid_user_guid: userInfo._json.bceid_user_guid,
          bceid_business_guid: userInfo._json.bceid_business_guid,
          display_name: userInfo._json.display_name,
          create_date: new Date(),
          update_date: new Date()
        }
      });
    }
  },
  async storeUserInfo(req, userInfo) {
    if (!userInfo?.jwt || !userInfo?._json) {
      throw new Error('No session data');
    }
    try {
      await prisma.$transaction(async (tx) => {
        await this.createOrUpdatePayTransparencyCompany(userInfo, req, tx);
        await this.createOrUpdatePayTransparencyUser(userInfo, tx);
      });
    } catch (e) {
      log.error(e);
      throw new Error('Error while storing user info');
    }
  },
  async handleCallBackBusinessBceid(req, res){
    const userInfo = utils.getSessionUser(req);
    const userGuid = jsonwebtoken.decode(userInfo.jwt)?.bceid_user_guid;
    if (!userGuid) {
      log.error(`no bceid_user_guid found in the jwt token`, userInfo.jwt);
      res.redirect(config.get('server:frontend') + '/login-error');
    }
    try {
      auth.validateClaims(userInfo.jwt);
      if(!req.session?.companyDetails){
        try{
          req.session.companyDetails = await getCompanyDetails(userGuid);
          await auth.storeUserInfo(req, userInfo);
        }catch (e) {
          log.error(`Error happened while getting company details from BCEID for user ${userGuid}`, e);
          res.redirect(config.get('server:frontend') + '/login-error');
        }
      }
      res.redirect(config.get('server:frontend'));
    }catch (e) {
      log.error('invalid claims in token', e);
      res.redirect(config.get('server:frontend') + '/login-error');
    }
  }
};

export {auth};
