import { NextFunction, Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { config } from '../../config';
import {
  KEYCLOAK_IDP_HINT_AZUREIDIR,
  OIDC_AZUREIDIR_SCOPE,
} from '../../constants';
import { logger as log } from '../../logger';
import { authUtils } from './auth-utils-service';
import { utils } from './utils-service';

enum LogoutReason {
  Login = 'login', // ie. don't log out
  Default = 'default',
  SessionExpired = 'sessionExpired',
  LoginError = 'loginError',
  LoginAzureIdir = 'loginAzureIdir',
  ContactError = 'contactError',
}

const adminAuth = {
  isTokenExpired(token: string) {
    return authUtils.isTokenExpired(token);
  },

  isRenewable(token: string) {
    return authUtils.isRenewable(token);
  },

  async renew(refreshToken: string) {
    const clientId = config.get('oidc:adminClientId');
    const clientSecret = config.get('oidc:adminClientSecret');
    const scope = OIDC_AZUREIDIR_SCOPE;
    return authUtils.renew(refreshToken, clientId, clientSecret, scope);
  },

  async refreshJWT(req: Request, _res: Response, next: NextFunction) {
    return authUtils.refreshJWT(req, _res, next, adminAuth.renew);
  },

  generateUiToken() {
    const audience = config.get('server:adminFrontend');
    return authUtils.generateUiToken(audience);
  },

  isValidBackendToken() {
    return authUtils.isValidBackendToken(adminAuth.validateClaims);
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

  async handleGetUserInfo(req: Request, res: Response) {
    const userInfo = utils.getSessionUser(req);
    if (!userInfo?.jwt || !userInfo?._json) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'No session data',
      });
    }
    const userInfoFrontend = {
      displayName: userInfo._json.display_name,
    };
    return res.status(HttpStatus.OK).json(userInfoFrontend);
  },

  async handleCallBackAzureIdir(req: Request): Promise<LogoutReason> {
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
