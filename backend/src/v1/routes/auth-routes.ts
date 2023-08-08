import {config} from '../../config';
import passport from 'passport';
import express from 'express';
import {auth} from '../services/auth-service';
import {logger as log} from '../../logger';
import {v4 as uuidv4} from 'uuid';
import {utils} from '../services/utils-service';

import {body, validationResult} from 'express-validator';

const router = express.Router();


router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/callback_business_bceid',
      '/login',
      '/logout',
      '/refresh',
      '/token'
    ]
  });
});

function addOIDCRouterGet(strategyName, callbackURI, redirectURL) {
  router.get(callbackURI,
    passport.authenticate(strategyName, {
      failureRedirect: 'error'
    }),
    (_req, res) => {
      res.redirect(redirectURL);
    }
  );
}


router.get('/callback_business_bceid',
  passport.authenticate('oidcBusinessBceid', {
    failureMessage: true
  }),
  (req, res) => {
    log.info(`Login flow callback bceid is called.`);
    console.info('session');
    console.info(req.session);
    console.info('query');
    console.info(req.query);
    console.info('user');
    console.info(req.user);
    console.info('sessionStore:');
    console.info(req.sessionStore);
    const userInfo = utils.getSessionUser(req);
    const accessToken = userInfo.jwt;
    const digitalID = userInfo._json.digitalIdentityID;
    const correlationID = req.session?.correlationID;
    res.redirect(config.get('server:frontend'));
  }
);
//a prettier way to handle errors
router.get('/error', (req, res) => {
  log.error(`Login flow Error happened`);
  console.info('session');
  console.info(req.session);
  console.info('query');
  console.info(req.query);
  console.info('user');
  console.info(req.user);
  console.info('sessionStore:');
  console.info(req.sessionStore);
  res.redirect(config.get('server:frontend') + '/login-error');
});

function addBaseRouterGet(strategyName, callbackURI) {
  router.get(callbackURI, passport.authenticate(strategyName, {
    failureRedirect: 'error'
  }));
}

addBaseRouterGet('oidcBusinessBceid', '/login_bceid');


//removes tokens and destroys session
router.get('/logout', async (req, res, next) => {
  const idToken = req['user']?.idToken;
  req.logout(async function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy();
    const discovery = await utils.getOidcDiscovery();
    let retUrl;
    if(idToken){
      if (req.query && req.query.sessionExpired) {
        retUrl = encodeURIComponent( discovery.end_session_endpoint + '?post_logout_redirect_uri=' + config.get('server:frontend') + '/session-expired' + '&id_token_hint=' + idToken);
      } else if (req.query && req.query.loginError) {
        retUrl = encodeURIComponent(discovery.end_session_endpoint + '?post_logout_redirect_uri=' + config.get('server:frontend') + '/login-error' + '&id_token_hint=' + idToken);
      } else if (req.query && req.query.loginBceid) {
        retUrl = encodeURIComponent(discovery.end_session_endpoint + '?post_logout_redirect_uri=' + config.get('server:frontend') + '/api/auth/login_bceid' + '&id_token_hint=' + idToken);
      } else {
        retUrl = encodeURIComponent(discovery.end_session_endpoint + '?post_logout_redirect_uri=' + config.get('server:frontend') + '/logout' + '&id_token_hint=' + idToken);
      }
      res.redirect(config.get('siteMinder_logout_endpoint') + retUrl);
    }else{
      res.redirect(config.get('server:frontend') + '/api/auth/login_bceid');
    }

  });
});

const UnauthorizedRsp = {
  error: 'Unauthorized',
  error_description: 'Not logged in'
};

//refreshes jwt on refresh if refreshToken is valid
router.post('/refresh', [
  body('refreshToken').exists()
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }
  if (!req['user'] || !req['user'].refreshToken || !req?.user?.jwt) {
    res.status(401).json(UnauthorizedRsp);
  } else {
    if (auth.isTokenExpired(req.user.jwt)) {
      if (req?.user?.refreshToken && auth.isRenewable(req.user.refreshToken)) {
        return generateTokens(req, res);
      } else {
        res.status(401).json(UnauthorizedRsp);
      }
    } else {
      const responseJson = {
        jwtFrontend: req.user.jwtFrontend
      };
      return res.status(200).json(responseJson);
    }
  }
});

//provides a jwt to authenticated users
router.get('/token', auth.refreshJWT, (req, res) => {
  if (req?.user && req.user?.jwtFrontend && req.user?.refreshToken) {
    if (req.session?.passport?.user?._json) {
      const correlationID = uuidv4();
      req.session.correlationID = correlationID;
      const correlation = {
        user_guid: req.session?.passport?.user?._json.user_guid,
        correlation_id: correlationID
      };
      log.info('created correlation id and stored in session', correlation);
    }
    const responseJson = {
      jwtFrontend: req.user.jwtFrontend
    };
    res.status(200).json(responseJson);
  } else {
    res.status(401).json(UnauthorizedRsp);
  }
});

async function generateTokens(req, res) {
  const result = await auth.renew(req.user.refreshToken);
  if (result && result.jwt && result.refreshToken) {
    req.user.jwt = result.jwt;
    req.user.refreshToken = result.refreshToken;
    req.user.jwtFrontend = auth.generateUiToken();
    const responseJson = {
      jwtFrontend: req.user.jwtFrontend
    };
    res.status(200).json(responseJson);
  } else {
    res.status(401).json(UnauthorizedRsp);
  }
}

router.get('/user-session-remaining-time', passport.authenticate('jwt', {session: false}), (req, res) => {
  if (req?.session?.cookie && req?.session?.passport?.user) {
    const remainingTime = req.session.cookie.maxAge;
    log.info(`session remaining time is :: ${remainingTime} for user`, req.session?.passport?.user?.displayName);
    return res.status(200).json(req.session.cookie.maxAge);
  } else {
    return res.sendStatus(401);
  }
});

//redirects to the SSO login screen
router.get('/login', passport.authenticate('oidcBusinessBceid', {
  failureRedirect: 'error'
}));
export = router;
