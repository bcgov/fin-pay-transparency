import axios from 'axios';
import { config } from '../../config';
import { logger as log } from '../../logger';
import jsonwebtoken, { JwtPayload, SignOptions } from 'jsonwebtoken';
import qs from 'querystring';
import { utils } from './utils-service';
import HttpStatus from 'http-status-codes';
import prisma, { PrismaTransactionalClient } from '../prisma/prisma-client';
import { getCompanyDetails } from '../../external/services/bceid-service';
import { Request, NextFunction, Response } from 'express';
import { pay_transparency_company } from '@prisma/client';
import { LogoutReason } from '../routes/auth-routes';

let kcPublicKey: string;
const auth = {
  // Check if JWT Access Token has expired
  isTokenExpired(token: string) {
    const now = Date.now().valueOf() / 1000;
    const payload = jsonwebtoken.decode(token);

    return !!payload['exp'] && payload['exp'] < now + 30; // Add 30 seconds to make sure , edge case is avoided and token is refreshed.
  },

  // Check if JWT Refresh Token has expired
  isRenewable(token: string) {
    const now = Date.now().valueOf() / 1000;
    const payload: JwtPayload = jsonwebtoken.decode(token) as JwtPayload;

    // Check if expiration exists, or lacks expiration
    return (
      (typeof payload.exp !== 'undefined' &&
        payload.exp !== null &&
        payload.exp === 0) ||
      payload.exp > now
    );
  },

  // Get new JWT and Refresh tokens
  async renew(refreshToken: string) {
    let result: any = {};

    try {
      const discovery = await utils.getOidcDiscovery();
      const response = await axios.post(
        discovery.token_endpoint,
        qs.stringify({
          client_id: config.get('oidc:clientId'),
          client_secret: config.get('oidc:clientSecret'),
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: 'bceidbusiness',
        }),
        {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
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
      result = error.response?.data;
    }

    return result;
  },

  // Update or remove token based on JWT and user state
  async refreshJWT(req: Request, _res: Response, next: NextFunction) {
    const user: any = req.user;
    try {
      if (user?.jwt) {
        log.verbose('refreshJWT', 'User & JWT exists');

        if (auth.isTokenExpired(user.jwt)) {
          log.verbose('refreshJWT', 'JWT has expired');

          if (!!user.refreshToken && auth.isRenewable(user.refreshToken)) {
            log.verbose('refreshJWT', 'Can refresh JWT token');

            // Get new JWT and Refresh Tokens and update the request
            const result: any = await auth.renew(user.refreshToken);
            user.jwt = result.jwt; // eslint-disable-line require-atomic-updates
            user.refreshToken = result.refreshToken; // eslint-disable-line require-atomic-updates
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
    const signOptions: SignOptions = {
      issuer: i,
      subject: s,
      audience: a,
      expiresIn: '30m',
      algorithm: 'RS256',
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
  validateClaims: function (jwt: any) {
    const payload: JwtPayload = jsonwebtoken.decode(jwt) as JwtPayload;
    if (payload?.identity_provider !== 'bceidbusiness') {
      throw new Error(
        'backend token invalid, identity_provider is not bceidbusiness',
        jwt,
      );
    }
    if (payload?.aud !== config.get('oidc:clientId')) {
      throw new Error(
        'backend token invalid, aud claim validation failed',
        jwt,
      );
    }
    return true;
  },
  isValidBackendToken() {
    return async function (req: Request, res: Response, next: NextFunction) {
      const session: any = req.session;
      if (!kcPublicKey) {
        kcPublicKey = await utils.getKeycloakPublicKey();
        if (!kcPublicKey) {
          log.error('error is from getKeycloakPublicKey');
          return res.status(HttpStatus.UNAUTHORIZED).json();
        }
      }
      if (session?.passport?.user?.jwt) {
        const jwt = session.passport.user.jwt;
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
  async getUserInfo(req: Request, res: Response) {
    const session: any = req.session;
    const userInfo = session?.passport?.user;
    if (!userInfo?.jwt || !userInfo?._json) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'No session data',
      });
    }
    const userInfoFrontend = {
      displayName: userInfo._json.display_name,
      ...session.companyDetails,
    };
    return res.status(HttpStatus.OK).json(userInfoFrontend);
  },

  /**
   * Creates new record if this bceid is not in db.
   * Or, updates an existing recored if the details are different
   * and makes a copy of the old record in the history table
   * @param company - The logged in user's company (including bceid)
   * @param tx
   */
  createOrUpdatePayTransparencyCompany: async function (
    company: pay_transparency_company,
    tx: PrismaTransactionalClient,
  ) {
    const { company_id, create_date, update_date, ...data } = company; // remove some properties

    const existingCompany = await tx.pay_transparency_company.findFirst({
      where: { bceid_business_guid: company.bceid_business_guid },
    });

    // If there is no existing company, create one
    if (!existingCompany) {
      await tx.pay_transparency_company.create({ data: data });
    }

    // If there is an existing company and the company details are different,
    // copy the record to the history and update the company
    else if (!this.isCompanyDetailsEqual(company, existingCompany)) {
      await tx.company_history.create({ data: existingCompany });

      await tx.pay_transparency_company.update({
        where: {
          company_id: existingCompany.company_id,
        },
        data: { ...data, create_date: new Date(), update_date: new Date() },
      });
    }
  },

  createOrUpdatePayTransparencyUser: async function (
    userInfo,
    tx: PrismaTransactionalClient,
  ) {
    const existingPayTransparencyUser =
      await tx.pay_transparency_user.findFirst({
        where: {
          bceid_user_guid: userInfo._json.bceid_user_guid,
          bceid_business_guid: userInfo._json.bceid_business_guid,
        },
      });
    if (existingPayTransparencyUser) {
      existingPayTransparencyUser.update_date = new Date();
      existingPayTransparencyUser.display_name = userInfo._json.display_name;
      await tx.pay_transparency_user.update({
        where: {
          user_id: existingPayTransparencyUser.user_id,
        },
        data: existingPayTransparencyUser,
      });
    } else {
      await tx.pay_transparency_user.create({
        data: {
          bceid_user_guid: userInfo._json.bceid_user_guid,
          bceid_business_guid: userInfo._json.bceid_business_guid,
          display_name: userInfo._json.display_name,
          create_date: new Date(),
          update_date: new Date(),
        },
      });
    }
  },
  /**
   * Convert the details returned from the BCeID SAOP service into
   * a pay_transparency_company database object
   */
  companyDetailsToRecord: function (
    details,
    bceid_guid = null,
  ): pay_transparency_company {
    return {
      bceid_business_guid: bceid_guid,
      company_id: null,
      address_line1: details.addressLine1,
      address_line2: details.addressLine2,
      city: details.city,
      company_name: details.legalName,
      country: details.country,
      postal_code: details.postal,
      province: details.province,
      create_date: null,
      update_date: null,
    };
  },
  /**
   * Check if the name and address of two company records are the same
   */
  isCompanyDetailsEqual: function (
    comp1: pay_transparency_company,
    comp2: pay_transparency_company,
  ): boolean {
    return (
      comp1.address_line1 === comp2.address_line1 &&
      comp1.address_line2 === comp2.address_line2 &&
      comp1.city === comp2.city &&
      comp1.company_name === comp2.company_name &&
      comp1.country === comp2.country &&
      comp1.postal_code === comp2.postal_code &&
      comp1.province === comp2.province
    );
  },

  async storeUserInfo(companyDetails, userInfo) {
    if (!userInfo?.jwt || !userInfo?._json) {
      throw new Error('No session data');
    }
    try {
      await prisma.$transaction(async (tx) => {
        const companyRecord: pay_transparency_company =
          this.companyDetailsToRecord(
            companyDetails,
            userInfo._json.bceid_business_guid,
          );
        await this.createOrUpdatePayTransparencyCompany(companyRecord, tx);
        await this.createOrUpdatePayTransparencyUser(userInfo, tx);
      });
    } catch (e) {
      log.error(e);
      throw new Error('Error while storing user info');
    }
  },

  async handleCallBackBusinessBceid(req: Request): Promise<LogoutReason> {
    const session: any = req.session;
    const userInfo = utils.getSessionUser(req);
    const jwtPayload = jsonwebtoken.decode(userInfo.jwt) as JwtPayload;
    const userGuid = jwtPayload?.bceid_user_guid;
    if (!userGuid) {
      log.error(`no bceid_user_guid found in the jwt token`, userInfo.jwt);
      return LogoutReason.LoginError;
    }

    try {
      auth.validateClaims(userInfo.jwt);
    } catch (e) {
      log.error('invalid claims in token', e);
      return LogoutReason.LoginError;
    }

    // companyDetails already saved - success
    if (session?.companyDetails) {
      return LogoutReason.Login;
    }

    // companyDetails haven't been saved - get them
    try {
      const details = await getCompanyDetails(userGuid);

      if (
        !details.legalName ||
        !details.addressLine1 ||
        !details.city ||
        !details.province ||
        !details.country ||
        !details.postal
      ) {
        log.error(
          `Required company details missing from BCEID for user ${userGuid}`,
        );
        return LogoutReason.ContactError;
      }

      await auth.storeUserInfo(details, userInfo);
      session.companyDetails = details;
    } catch (e) {
      log.error(
        `Error happened while getting company details from BCEID for user ${userGuid}`,
        e,
      );
      return LogoutReason.LoginError;
    }

    return LogoutReason.Login;
  },
};

export { auth };
