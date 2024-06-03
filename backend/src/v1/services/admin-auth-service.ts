import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import jsonwebtoken, { JwtPayload, SignOptions } from 'jsonwebtoken';
import qs from 'querystring';
import { config } from '../../config';
import {
  KEYCLOAK_IDP_HINT_AZUREIDIR,
  OIDC_AZUREIDIR_SCOPE,
} from '../../constants';
import { logger as log } from '../../logger';
import { utils } from './utils-service';

enum LogoutReason {
  Login = 'login', // ie. don't log out
  Default = 'default',
  SessionExpired = 'sessionExpired',
  LoginError = 'loginError',
  LoginAzureIdir = 'loginAzureIdir',
  ContactError = 'contactError',
}

let kcPublicKey: string;
// TODO look at all the methods in this file, make them reusable from utils with parameters.
const adminAuth = {
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
          client_id: config.get('oidc:adminClientId'),
          client_secret: config.get('oidc:adminClientSecret'),
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: OIDC_AZUREIDIR_SCOPE,
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

        if (adminAuth.isTokenExpired(user.jwt)) {
          log.verbose('refreshJWT', 'JWT has expired');

          if (!!user.refreshToken && adminAuth.isRenewable(user.refreshToken)) {
            log.verbose('refreshJWT', 'Can refresh JWT token');

            // Get new JWT and Refresh Tokens and update the request
            const result: any = await adminAuth.renew(user.refreshToken);
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
  // TODO make this an util method with parameters which can be reused for both admin and public site.
  generateUiToken() {
    const i = config.get('tokenGenerate:issuer');
    const s = 'user@finpaytransparency.ca';
    const a = config.get('server:adminFrontend');
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
   * The token should be issued by azureidir and the audience should be the configured client id
   * Since the app is using the standard realm of Keycloak, this extra check is required to make sure other users are not able to get access.
   * https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-validate-the-idp-in-the-jwt
   * @param jwt the token
   */
  validateClaims: function (jwt: any) {
    const payload: JwtPayload = jsonwebtoken.decode(jwt) as JwtPayload;
    if (payload?.identity_provider !== KEYCLOAK_IDP_HINT_AZUREIDIR) {
      throw new Error(
        `backend token invalid, identity_provider is not ${KEYCLOAK_IDP_HINT_AZUREIDIR}`,
        jwt,
      );
    }
    if (payload?.aud !== config.get('oidc:adminClientId')) {
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
          adminAuth.validateClaims(jwt);
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

  async handleCallBackIdir(req: Request): Promise<LogoutReason> {
    const userInfo = utils.getSessionUser(req);
    const jwtPayload = jsonwebtoken.decode(userInfo.jwt) as JwtPayload;
    const idirUserGuid = jwtPayload?.idir_user_guid;
    if (!idirUserGuid) {
      log.error(`no idir_user_guid found in the jwt token`, userInfo.jwt);
      return LogoutReason.LoginError;
    }

    try {
      adminAuth.validateClaims(userInfo.jwt);
    } catch (e) {
      log.error('invalid claims in token', e);
      return LogoutReason.LoginError;
    }

    return LogoutReason.Login;
  },
};

export { LogoutReason, adminAuth };
