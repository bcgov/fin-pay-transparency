import express from 'express';

import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import noCache from 'nocache';
import passport from 'passport';
import { resolve } from 'path';
import { config } from './config';
import authRouter from './v1/routes/auth-routes';
import codeRouter from './v1/routes/code-routes';
import { fileUploadRouter } from './v1/routes/file-upload-routes';
import userRouter from './v1/routes/user-info-routes';
import { reportRouter } from './v1/routes/report-routes';
import { auth } from './v1/services/auth-service';
import { utils } from './v1/services/utils-service';
import prom from 'prom-client';
import prisma from './v1/prisma/prisma-client';
import { logger } from './logger';
import { rateLimit } from 'express-rate-limit';
const register = new prom.Registry();
prom.collectDefaultMetrics({ register });
const app = express();
const apiRouter = express.Router();

const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const OidcStrategy = require('passport-openidconnect-keycloak-idp').Strategy;
const fileSession = require('session-file-store')(session);
const logStream = {
  write: (message) => {
    logger.info(message);
  },
};

// NOSONAR
app.use(cors());
app.use(helmet());
app.use(noCache());

//tells the app to use json as means of transporting data
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
  }),
);

const cookie = {
  httpOnly: true,
  maxAge: 1800000, //30 minutes in ms. this is same as session time. DO NOT MODIFY, IF MODIFIED, MAKE SURE SAME AS SESSION TIME OUT VALUE.
};

//sets cookies for security purposes (prevent cookie access, allow secure connections only, etc)
const sess = {
  name: 'fin_pay_transparency_cookie',
  secret: config.get('oidc:clientSecret'),
  resave: false,
  saveUninitialized: false,
  cookie: cookie,
  store: new fileSession({
    path: resolve('./', config.get('server:sessionPath')),
    logFn: (msg: string) => {
      logger.silly(msg);
    },
  }),
};
if ('production' === config.get('environment')) {
  app.set('trust proxy', 1);
}
app.use(session(sess));
//initialize routing and session. Cookies are now only reachable via requests (not js)
app.use(passport.initialize());
app.use(passport.session());

function addLoginPassportUse(
  discovery,
  strategyName,
  callbackURI,
  kc_idp_hint,
) {
  logger.debug(`Adding strategy ${strategyName} with callback ${callbackURI}`);
  logger.debug(`discovery: ${JSON.stringify(discovery)}`);
  passport.use(
    strategyName,
    new OidcStrategy(
      {
        issuer: discovery.issuer,
        authorizationURL: discovery.authorization_endpoint,
        tokenURL: discovery.token_endpoint,
        userInfoURL: discovery.userinfo_endpoint,
        clientID: config.get('oidc:clientId'),
        clientSecret: config.get('oidc:clientSecret'),
        callbackURL: callbackURI,
        scope: 'bceidbusiness',
        kc_idp_hint: kc_idp_hint,
        sessionKey: 'fin-pay-transparency',
      },
      (
        _issuer,
        profile,
        _context,
        idToken,
        accessToken,
        refreshToken,
        done,
      ) => {
        logger.debug(
          `Login flow first pass done. accessToken: ${accessToken}, refreshToken: ${refreshToken}, idToken: ${idToken}`,
        );
        if (
          typeof accessToken === 'undefined' ||
          accessToken === null ||
          typeof refreshToken === 'undefined' ||
          refreshToken === null
        ) {
          return done('No access token', null);
        }

        //set access and refresh tokens
        profile.jwtFrontend = auth.generateUiToken();
        profile.jwt = accessToken;
        profile._json = parseJwt(accessToken);
        profile.refreshToken = refreshToken;
        profile.idToken = idToken;
        return done(null, profile);
      },
    ),
  );
}

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

//initialize our authentication strategy
utils.getOidcDiscovery().then((discovery) => {
  //OIDC Strategy is used for authorization
  addLoginPassportUse(
    discovery,
    'oidcBusinessBceid',
    config.get('server:frontend') + '/api/auth/callback_business_bceid',
    'bceidbusiness',
  );
  //JWT strategy is used for authorization
  passport.use(
    'jwt',
    new JWTStrategy(
      {
        algorithms: ['RS256'],
        // Keycloak 7.3.0 no longer automatically supplies matching client_id audience.
        // If audience checking is needed, check the following SO to update Keycloak first.
        // Ref: https://stackoverflow.com/a/53627747
        audience: config.get('server:frontend'),
        issuer: config.get('tokenGenerate:issuer'),
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.get('tokenGenerate:publicKey'),
        ignoreExpiration: true,
      },
      (jwtPayload, done) => {
        if (typeof jwtPayload === 'undefined' || jwtPayload === null) {
          return done('No JWT token', null);
        }

        done(null, {
          email: jwtPayload.email,
          familyName: jwtPayload.family_name,
          givenName: jwtPayload.given_name,
          jwt: jwtPayload,
          name: jwtPayload.name,
          user_guid: jwtPayload.user_guid,
          realmRole: jwtPayload.realm_role,
        });
      },
    ),
  );
});
//functions for serializing/deserializing users
passport.serializeUser((user, next) => next(null, user));
passport.deserializeUser((obj, next) => next(null, obj));
app.use(
  morgan('dev', {
    stream: logStream,
    skip: (req) => {
      return (
        req.baseUrl === '' || req.baseUrl === '/' || req.baseUrl === '/health'
      );
    },
  }),
);
if (config.get('server:rateLimit:enabled')) {
  const limiter = rateLimit({
    windowMs: config.get('server:rateLimit:windowMs'),
    limit: config.get('server:rateLimit:limit'),
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers,
    skipSuccessfulRequests: true, // Do not count successful responses
  });
  app.use(limiter);
}
app.get('/metrics', async (_req, res) => {
  const prismaMetrics = await prisma.$metrics.prometheus();
  const appMetrics = await register.metrics();
  res.end(prismaMetrics + appMetrics);
});

app.use(/(\/api)?/, apiRouter);
apiRouter.get('/', (_req, res) => {
  res.sendStatus(200); // generally for route verification and health check.
});
apiRouter.use('/auth', authRouter);
apiRouter.use('/user', userRouter);
apiRouter.use('/v1/file-upload', fileUploadRouter);
apiRouter.use('/v1/codes', codeRouter);
apiRouter.use('/v1/report', reportRouter);
export { app };
