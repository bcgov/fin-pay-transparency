import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import { config } from '../../config';
import {
  MISSING_COMPANY_DETAILS_ERROR,
  MISSING_TOKENS_ERROR,
} from '../../constants';
import { logger as log } from '../../logger';
import { UnauthorizedRsp } from '../services/auth-utils-service';
import { LogoutReason, publicAuth } from '../services/public-auth-service';
import { utils } from '../services/utils-service';

const router = express.Router();

router.get(
  '/callback_business_bceid',
  passport.authenticate('oidcBusinessBceid', {
    failureMessage: true,
  }),
  utils.asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      log.debug(`Login flow callback business bceid is called.`);
      const logoutReason = await publicAuth.handleCallBackBusinessBceid(req);
      if (logoutReason == LogoutReason.Login)
        return res.redirect(config.get('server:frontend'));
      else return logoutHandler(req, res, next, logoutReason);
    },
  ),
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
async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
  reason: LogoutReason,
) {
  // @ts-expect-error, it is given by passport lib.
  const idToken: string = req['user']?.idToken;
  const discovery = await utils.getOidcDiscovery();
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        log.error(`Logout failed - ${err.message}`);
        return next(err);
      }
    });

    if (idToken) {
      let url = '';

      if (reason == 'sessionExpired') url = '/session-expired';
      else if (reason == 'loginError') url = '/login-error';
      else if (reason == 'loginBceid') url = '/api/auth/login_bceid';
      else if (reason == 'contactError') url = '/contact-error';
      else url = '/logout';

      const retUrl = encodeURIComponent(
        discovery.end_session_endpoint +
          '?post_logout_redirect_uri=' +
          config.get('server:frontend') +
          url +
          '&id_token_hint=' +
          idToken,
      );
      res.redirect(config.get('siteMinder_logout_endpoint') + retUrl);
    } else {
      res.redirect(config.get('server:frontend') + '/api/auth/login_bceid');
    }
  });
}

router.get(
  '/logout',
  utils.asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let reason: LogoutReason = LogoutReason.Default;
      if (req.query?.sessionExpired) reason = LogoutReason.SessionExpired;
      else if (req.query?.loginError) reason = LogoutReason.LoginError;
      else if (req.query?.loginBceid) reason = LogoutReason.LoginBceid;
      else if (req.query?.contactError) reason = LogoutReason.ContactError;
      await logoutHandler(req, res, next, reason);
    },
  ),
);

//refreshes jwt on refresh if refreshToken is valid
router.post(
  '/refresh',
  [body('refreshToken').exists()],
  utils.asyncHandler(async (req: Request, res: Response) => {
    const user: any = req.user;
    const session: any = req.session;
    const errors = validationResult(req);

    if (!session?.companyDetails) {
      if (session?.correlationID) {
        log.error(
          `${MISSING_COMPANY_DETAILS_ERROR} for correlationID: ${session?.correlationID}`,
        );
      } else {
        log.error(
          `${MISSING_COMPANY_DETAILS_ERROR} in session. No correlation id found.`,
        );
      }

      return res.status(401).json({ error: MISSING_COMPANY_DETAILS_ERROR });
    }

    if (!errors.isEmpty()) {
      log.error(JSON.stringify(errors));
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    if (!user?.refreshToken || !user?.jwt) {
      log.error(MISSING_TOKENS_ERROR);
      res.status(401).json(UnauthorizedRsp);
    } else if (publicAuth.isTokenExpired(user.jwt)) {
      if (user?.refreshToken && publicAuth.isRenewable(user.refreshToken)) {
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
  }),
);

//provides a jwt to authenticated users
router.get(
  '/token',
  utils.asyncHandler(publicAuth.refreshJWT),
  publicAuth.handleGetToken,

  /*
  (req: Request, res: Response) => {
    const user: any = req.user;
    const session: any = req.session;
    if (!session?.companyDetails) {
      log.error(
        `${MISSING_COMPANY_DETAILS_ERROR} for user: ${session?.correlationID}`,
      );
      return res.status(401).json({ error: MISSING_COMPANY_DETAILS_ERROR });
    }
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
      log.error(JSON.stringify(UnauthorizedRsp));
      res.status(401).json(UnauthorizedRsp);
    }
  },
  */
);

async function generateTokens(req: Request, res: Response) {
  const user: any = req.user;
  const session: any = req.session;
  const result = await publicAuth.renew(user.refreshToken);
  if (result?.jwt && result?.refreshToken) {
    user.jwt = result.jwt;
    user.refreshToken = result.refreshToken;
    user.jwtFrontend = publicAuth.generateUiToken();
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
