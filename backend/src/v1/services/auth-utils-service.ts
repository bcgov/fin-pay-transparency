import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import jsonwebtoken, { JwtPayload, SignOptions } from 'jsonwebtoken';
import qs from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { logger as log } from '../../logger';
import { utils } from './utils-service';

/*
This service contains functions related to authentication that are common between
the public-facing app and the admin app.  
*/

const UnauthorizedRsp = {
  error: 'Unauthorized',
  error_description: 'Not logged in',
};

let kcPublicKey: string;

abstract class AuthBase {
  public abstract renew(refreshToken: string);
  public abstract generateFrontendToken();
  public abstract getUserDescription(session: any): string;
  public abstract validateClaims(jwt: any);
  public abstract handleGetUserInfo(req: Request, res: Response);
  public abstract handleGetToken(req: Request, res: Response);

  public isTokenExpired(token: string) {
    const now = Date.now().valueOf() / 1000;
    const payload = jsonwebtoken.decode(token);
    return !!payload['exp'] && payload['exp'] < now + 30; // Add 30 seconds to make sure , edge case is avoided and token is refreshed.
  }

  public isRenewable(token: string) {
    const now = Date.now().valueOf() / 1000;
    const payload: JwtPayload = jsonwebtoken.decode(token) as JwtPayload;

    // Check if expiration exists, or lacks expiration
    return (
      (typeof payload.exp !== 'undefined' &&
        payload.exp !== null &&
        payload.exp === 0) ||
      payload.exp > now
    );
  }

  // Update or remove token based on JWT and user state
  public refreshJWT = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    const user: any = req.user;
    try {
      if (user?.jwt) {
        log.verbose('refreshJWT', 'User & JWT exists');

        if (this.isTokenExpired(user.jwt)) {
          log.verbose('refreshJWT', 'JWT has expired');

          if (!!user.refreshToken && this.isRenewable(user.refreshToken)) {
            log.verbose('refreshJWT', 'Can refresh JWT token');

            // Get new JWT and Refresh Tokens and update the request
            const result: any = await this.renew(user.refreshToken);
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
  };

  public handleGetTokenImpl = async (
    req: Request,
    res: Response,
  ): Promise<any> => {
    const user: any = req.user;
    const session: any = req.session;
    if (user?.jwtFrontend && user?.refreshToken) {
      if (session?.passport?.user?._json) {
        req.session['correlationID'] = uuidv4();
        log.info(
          `Created correlation ID ${session.correlationID} for user ${this.getUserDescription(session)}, and added to session`,
        );
      }
      const responseJson = {
        jwtFrontend: user.jwtFrontend,
        correlationID: session.correlationID,
      };
      res.status(200).json(responseJson);
    } else {
      log.error(JSON.stringify(UnauthorizedRsp));
      res.status(401).json(UnauthorizedRsp);
    }
  };

  public renewBackendAndFrontendTokens = async (
    req: Request,
    res: Response,
  ) => {
    const user: any = req.user;
    const session: any = req.session;
    const result = await this.renew(user.refreshToken);
    if (result?.jwt && result?.refreshToken) {
      user.jwt = result.jwt;
      user.refreshToken = result.refreshToken;
      user.jwtFrontend = this.generateFrontendToken();
      const responseJson = {
        jwtFrontend: user.jwtFrontend,
        correlationID: session.correlationID,
      };
      res.status(200).json(responseJson);
    } else {
      res.status(401).json(UnauthorizedRsp);
    }
  };

  public isValidBackendToken = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
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
          this.validateClaims(jwt);
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
  };

  // Protected interface
  // ---------------------------------------------------------------------------

  // Get new JWT and Refresh tokens
  protected async renewImpl(
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
  }

  protected generateFrontendTokenImpl(audience: string): string {
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
  }
}

export { AuthBase, UnauthorizedRsp };
