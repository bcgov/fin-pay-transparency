import { config } from '../../config';
import passport from 'passport';
import express, { NextFunction, Request, Response } from 'express';
import { auth } from '../services/auth-service';
import { logger as log } from '../../logger';
import { v4 as uuidv4 } from 'uuid';
import { utils } from '../services/utils-service';

import { body, validationResult } from 'express-validator';

const router = express.Router();

router.get(
  '/callback_business_bceid',
  passport.authenticate('oidcBusinessBceid', {
    failureMessage: true,
  }),
  async (req, res) => {
    log.debug(`Login flow callback business bceid is called.`);
    await auth.handleCallBackBusinessBceid(req, res);
  },
);
//a prettier way to handle errors
router.get('/error', (req, res) => {
  log.error(`Login flow Error happened`);
  res.redirect(config.get('server:frontend') + '/login-error');
});

function addBaseRouterGet(strategyName, callbackURI) {
  router.get(
    callbackURI,
    passport.authenticate(strategyName, {
      failureRedirect: 'error',
    }),
  );
}

addBaseRouterGet('oidcBusinessBceid', '/login_bceid');

//removes tokens and destroys session
router.get(
  '/logout',
  async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore, it is given by passport lib.
    const idToken: string = req['user']?.idToken;
    req.logout(async function (err) {
      if (err) {
        return next(err);
      }
      req.session.destroy((err) => {
        if (err) {
          log.error(`Logout failed - ${err.message}`);
          return next(err);
        }
      });
      const discovery = await utils.getOidcDiscovery();
      let retUrl;
      if (idToken) {
        if (req.query?.sessionExpired) {
          retUrl = encodeURIComponent(
            discovery.end_session_endpoint +
              '?post_logout_redirect_uri=' +
              config.get('server:frontend') +
              '/session-expired' +
              '&id_token_hint=' +
              idToken,
          );
        } else if (req.query?.loginError) {
          retUrl = encodeURIComponent(
            discovery.end_session_endpoint +
              '?post_logout_redirect_uri=' +
              config.get('server:frontend') +
              '/login-error' +
              '&id_token_hint=' +
              idToken,
          );
        } else if (req.query?.loginBceid) {
          retUrl = encodeURIComponent(
            discovery.end_session_endpoint +
              '?post_logout_redirect_uri=' +
              config.get('server:frontend') +
              '/api/auth/login_bceid' +
              '&id_token_hint=' +
              idToken,
          );
        } else {
          retUrl = encodeURIComponent(
            discovery.end_session_endpoint +
              '?post_logout_redirect_uri=' +
              config.get('server:frontend') +
              '/logout' +
              '&id_token_hint=' +
              idToken,
          );
        }
        res.redirect(config.get('siteMinder_logout_endpoint') + retUrl);
      } else {
        res.redirect(config.get('server:frontend') + '/api/auth/login_bceid');
      }
    });
  },
);

const UnauthorizedRsp = {
  error: 'Unauthorized',
  error_description: 'Not logged in',
};

//refreshes jwt on refresh if refreshToken is valid
router.post(
  '/refresh',
  [body('refreshToken').exists()],
  async (req: Request, res: Response) => {
    const user: any = req.user;
    const session: any = req.session;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    if (!user?.refreshToken || !user?.jwt) {
      res.status(401).json(UnauthorizedRsp);
    } else if (auth.isTokenExpired(user.jwt)) {
      if (user?.refreshToken && auth.isRenewable(user.refreshToken)) {
        return generateTokens(req, res);
      } else {
        res.status(401).json(UnauthorizedRsp);
      }
    } else {
      const responseJson = {
        jwtFrontend: user.jwtFrontend,
        correlationID: session.correlationID,
      };
      return res.status(200).json(responseJson);
    }
  },
);

//provides a jwt to authenticated users
router.get('/token', auth.refreshJWT, (req: Request, res: Response) => {
  const user: any = req.user;
  const session: any = req.session;
  if (user?.jwtFrontend && user?.refreshToken) {
    if (session?.passport?.user?._json) {
      req.session['correlationID'] = uuidv4();
      log.info(
        `created correlation id and stored in session for user guid: ${session?.passport?.user?._json?.bceid_user_guid}, user name: ${session?.passport?.user?._json?.bceid_username}, correlation_id:  ${session.correlationID}`,
      );
    }
    const responseJson = {
      jwtFrontend: user.jwtFrontend,
      correlationID: session.correlationID,
    };
    res.status(200).json(responseJson);
  } else {
    res.status(401).json(UnauthorizedRsp);
  }
});

async function generateTokens(req: Request, res: Response) {
  const user: any = req.user;
  const session: any = req.session;
  const result = await auth.renew(user.refreshToken);
  if (result?.jwt && result?.refreshToken) {
    user.jwt = result.jwt;
    user.refreshToken = result.refreshToken;
    user.jwtFrontend = auth.generateUiToken();
    const responseJson = {
      jwtFrontend: user.jwtFrontend,
      correlationID: session.correlationID,
    };
    res.status(200).json(responseJson);
  } else {
    res.status(401).json(UnauthorizedRsp);
  }
}

//redirects to the SSO login screen
router.get(
  '/login',
  passport.authenticate('oidcBusinessBceid', {
    failureRedirect: 'error',
  }),
);
export default router;
