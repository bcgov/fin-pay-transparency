import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import { config } from '../../config';
import {
  MISSING_TOKENS_ERROR,
  OIDC_AZUREIDIR_CALLBACK_NAME,
  OIDC_AZUREIDIR_STRATEGY_NAME,
} from '../../constants';
import { logger as log } from '../../logger';
import { LogoutReason, adminAuth } from '../services/admin-auth-service';
import { UnauthorizedRsp } from '../services/auth-utils-service';
import { utils } from '../services/utils-service';

const router = express.Router();

router.get(
  `/${OIDC_AZUREIDIR_CALLBACK_NAME}`,
  passport.authenticate(OIDC_AZUREIDIR_STRATEGY_NAME, {
    failureMessage: true,
  }),
  utils.asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      log.debug(`Login flow callback idir is called.`);
      const logoutReason = await adminAuth.handleCallBackAzureIdir(req);
      if (logoutReason == LogoutReason.Login)
        return res.redirect(config.get('server:adminFrontend'));
      else return logoutHandler(req, res, next, logoutReason);
    },
  ),
);

//a prettier way to handle errors
router.get('/error', (req, res) => {
  log.error(`Login flow Error happened`);
  res.redirect(config.get('server:adminFrontend') + '/login-error');
});

function addBaseRouterGet(strategyName, callbackURI) {
  router.get(
    callbackURI,
    passport.authenticate(strategyName, {
      failureRedirect: 'error',
    }),
  );
}

addBaseRouterGet(OIDC_AZUREIDIR_STRATEGY_NAME, '/login-azureidir');

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
      else if (reason == 'notAuthorized') url = '/unauthorized';
      else if (reason == 'roleChanged') url = '/login';
      else if (reason == LogoutReason.LoginAzureIdir)
        url = '/admin-api/auth/login-azureidir';
      else if (reason == 'contactError') url = '/contact-error';
      else url = '/logout';

      const postLogoutRedirectUri = config.get('server:adminFrontend') + url;

      const retUrl = encodeURIComponent(
        discovery.end_session_endpoint +
          '?post_logout_redirect_uri=' +
          postLogoutRedirectUri +
          '&id_token_hint=' +
          idToken,
      );

      res.redirect(config.get('siteMinder_logout_endpoint') + retUrl);
    } else {
      res.redirect(
        config.get('server:adminFrontend') + '/admin-api/auth/login-azureidir',
      );
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
      else if (req.query?.loginIdir) reason = LogoutReason.LoginAzureIdir;
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

    if (!errors.isEmpty()) {
      log.error(JSON.stringify(errors));
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    if (!user?.refreshToken || !user?.jwt) {
      log.error(MISSING_TOKENS_ERROR);
      res.status(401).json(UnauthorizedRsp);
    } else if (adminAuth.isTokenExpired(user.jwt)) {
      if (user?.refreshToken && adminAuth.isRenewable(user.refreshToken)) {
        return adminAuth.renewBackendAndFrontendTokens(req, res);
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
  utils.asyncHandler(adminAuth.refreshJWT),
  adminAuth.handleGetToken,
);

//redirects to the SSO login screen
router.get(
  '/login',
  passport.authenticate(OIDC_AZUREIDIR_STRATEGY_NAME, {
    failureRedirect: 'error',
  }),
);
export default router;
