import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import jsonwebtoken, { JwtPayload, SignOptions } from 'jsonwebtoken';
import qs from 'querystring';
import { config } from '../../config';
import { logger as log } from '../../logger';
import { utils } from './utils-service';

let kcPublicKey: string;

const authUtils = {
  // Check if JWT Access Token has expired
  isTokenExpired(token: string) {
    const now = Date.now().valueOf() / 1000;
    const payload = jsonwebtoken.decode(token);

    return !!payload['exp'] && payload['exp'] < now + 30; // Add 30 seconds to make sure , edge case is avoided and token is refreshed.
  },

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
  async renew(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    scope: string,
  ) {
    let result: any = {};

    try {
      const discovery = await utils.getOidcDiscovery();
      const response = await axios.post(
        discovery.token_endpoint,
        qs.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          scope: scope,
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
  async refreshJWT(
    req: Request,
    _res: Response,
    next: NextFunction,
    renew: { (refreshToken: string): Promise<string> },
  ) {
    const user: any = req.user;
    try {
      if (user?.jwt) {
        log.verbose('refreshJWT', 'User & JWT exists');

        if (this.isTokenExpired(user.jwt)) {
          log.verbose('refreshJWT', 'JWT has expired');

          if (!!user.refreshToken && this.isRenewable(user.refreshToken)) {
            log.verbose('refreshJWT', 'Can refresh JWT token');

            // Get new JWT and Refresh Tokens and update the request
            const result: any = await renew(user.refreshToken);
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

  generateUiToken(audience: string) {
    const i = config.get('tokenGenerate:issuer');
    const s = 'user@finpaytransparency.ca';
    const signOptions: SignOptions = {
      issuer: i,
      subject: s,
      audience: audience,
      expiresIn: '30m',
      algorithm: 'RS256',
    };
    const privateKey = config.get('tokenGenerate:privateKey');
    const uiToken = jsonwebtoken.sign({}, privateKey, signOptions);
    log.verbose('Generated JWT', uiToken);
    return uiToken;
  },

  isValidBackendToken(validateClaims: Function) {
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
          validateClaims(jwt);
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
};

export { authUtils };
