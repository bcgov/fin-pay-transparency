import express, { NextFunction, Request, Response } from 'express';

import bodyParser from 'body-parser';
import promBundle from 'express-prom-bundle';
import { rateLimit } from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import noCache from 'nocache';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import passportOIDCKCIdp from 'passport-openidconnect-keycloak-idp';
import { resolve } from 'path';
import prom from 'prom-client';
import fileSessionStore from 'session-file-store';
import { config } from './config';
import {
  KEYCLOAK_IDP_HINT_AZUREIDIR,
  OIDC_AZUREIDIR_CALLBACK_NAME,
  OIDC_AZUREIDIR_SCOPE,
  OIDC_AZUREIDIR_STRATEGY_NAME,
} from './constants';
import { logger } from './logger';
import prisma from './v1/prisma/prisma-client';
import adminAuthRouter from './v1/routes/admin-auth-routes';
import adminReportRoutes from './v1/routes/admin-report-routes';
import adminUsersRoutes from './v1/routes/admin-users-routes';
import adminUserRouter from './v1/routes/admin-user-info-routes';
import codeRouter from './v1/routes/code-routes';
import announcementsRoutes from './v1/routes/announcement-routes';
import analyticRoutes from './v1/routes/analytic-routes';
import { adminAuth } from './v1/services/admin-auth-service';
import { utils } from './v1/services/utils-service';

export const OIDC_AZUREIDIR_CALLBACK_URL = `${config.get('server:adminFrontend')}/admin-api/auth/${OIDC_AZUREIDIR_CALLBACK_NAME}`;

import { run as startJobs } from './schedulers/run.all';
import adminUserInvitesRoutes from './v1/routes/admin-user-invites-routes';
startJobs();

const register = new prom.Registry();
prom.collectDefaultMetrics({ register });
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  metricsPath: '/prom-metrics',
  promRegistry: register,
});
const adminApp = express();
adminApp.set('trust proxy', 1);
const apiRouter = express.Router();

const JWTStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

const OidcStrategy = passportOIDCKCIdp.Strategy;
const fileSession = fileSessionStore(session);
const logStream = {
  write: (message) => {
    logger.info(message);
  },
};

adminApp.use(helmet());
adminApp.use(noCache());

//tells the app to use json as means of transporting data
adminApp.use(bodyParser.json());
adminApp.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
let proxy = true;
const cookie = {
  secure: true,
  httpOnly: true,
  maxAge: 1800000, //30 minutes in ms. this is same as session time. DO NOT MODIFY, IF MODIFIED, MAKE SURE SAME AS SESSION TIME OUT VALUE.
};
if ('local' === config.get('environment')) {
  cookie.secure = false;
  proxy = false;
}

//sets cookies for security purposes (prevent cookie access, allow secure connections only, etc)
const sess = {
  name: 'fin_pay_transparency_admin_cookie',
  secret: config.get('oidc:adminClientSecret'),
  resave: false,
  saveUninitialized: true,
  cookie: cookie,
  proxy,
  store: new fileSession({
    path: resolve('./', config.get('server:adminSessionPath')),
    logFn: (msg: string) => {
      logger.silly(msg);
    },
  }),
};
adminApp.use(session(sess));
//initialize routing and session. Cookies are now only reachable via requests (not js)
adminApp.use(passport.initialize());
adminApp.use(passport.session());

function addLoginPassportUse(
  oicdDiscoveryDocument,
  strategyName,
  callbackURI,
  scope,
  kc_idp_hint,
) {
  logger.debug(`Adding strategy ${strategyName} with callback ${callbackURI}`);
  logger.debug(`Discovery: ${JSON.stringify(oicdDiscoveryDocument)}`);
  passport.use(
    strategyName,
    new OidcStrategy(
      {
        issuer: oicdDiscoveryDocument.issuer,
        authorizationURL: oicdDiscoveryDocument.authorization_endpoint,
        tokenURL: oicdDiscoveryDocument.token_endpoint,
        userInfoURL: oicdDiscoveryDocument.userinfo_endpoint,
        clientID: config.get('oidc:adminClientId'),
        clientSecret: config.get('oidc:adminClientSecret'),
        callbackURL: callbackURI,
        scope: scope,
        kc_idp_hint: kc_idp_hint,
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
        if (accessToken == null || refreshToken == null) {
          return done('No access token', null);
        }

        //set access and refresh tokens
        profile.jwtFrontend = adminAuth.generateFrontendToken();
        profile.jwt = accessToken;
        profile._json = utils.parseJwt(accessToken);
        profile.refreshToken = refreshToken;
        profile.idToken = idToken;
        return done(null, profile);
      },
    ),
  );
}

//initialize our authentication strategy
utils.getOidcDiscovery().then(
  (oicdDiscoveryDocument) => {
    //OIDC Strategy is used for authorization
    addLoginPassportUse(
      oicdDiscoveryDocument,
      OIDC_AZUREIDIR_STRATEGY_NAME,
      OIDC_AZUREIDIR_CALLBACK_URL,
      OIDC_AZUREIDIR_SCOPE,
      KEYCLOAK_IDP_HINT_AZUREIDIR,
    );
    //JWT strategy is used for authorization
    passport.use(
      'jwt_admin',
      new JWTStrategy(
        {
          algorithms: ['RS256'],
          // Keycloak 7.3.0 no longer automatically supplies matching client_id audience.
          // If audience checking is needed, check the following SO to update Keycloak first.
          // Ref: https://stackoverflow.com/a/53627747
          audience: config.get('server:adminFrontend'),
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
  },
  () => {},
);
//functions for serializing/deserializing users
passport.serializeUser((user, next) => next(null, user));
passport.deserializeUser((obj, next) => next(null, obj));
adminApp.use(
  morgan(
    ':method | :url | :status |  :response-time ms | :req[x-correlation-id] | :res[content-length]',
    {
      stream: logStream,
      skip: (req) => {
        return (
          req.baseUrl === '' || req.baseUrl === '/' || req.baseUrl === '/health'
        );
      },
    },
  ),
);

if (config.get('server:rateLimit:enabled')) {
  const limiter = rateLimit({
    windowMs: config.get('server:rateLimit:windowMs'),
    limit: config.get('server:rateLimit:limit'),
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers,
    skipSuccessfulRequests: true, // Do not count successful responses
  });
  adminApp.use(limiter);
}
adminApp.use(metricsMiddleware);
adminApp.get(
  '/metrics',
  utils.asyncHandler(async (_req: Request, res: Response) => {
    const prismaMetrics = await prisma.$metrics.prometheus();
    const appMetrics = await register.metrics();
    res.end(prismaMetrics + appMetrics);
  }),
);
adminApp.get(
  '/health',
  utils.asyncHandler(async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).send('Health check passed');
    } catch (e) {
      logger.error(`Health check failed: ${e}`);
      res.status(500).send('Health check failed');
    }
  }),
);

adminApp.use(/(\/admin-api)?/, apiRouter);
apiRouter.get('/', (_req, res) => {
  res.sendStatus(200); // generally for route verification and health check.
});
apiRouter.use('/auth', adminAuthRouter);

// check for valid passport session and backend token for all routes below.
apiRouter.use(
  passport.authenticate('jwt_admin', { session: false }),
  (req: Request, res: Response, next: NextFunction) => {
    adminAuth.isValidBackendToken()(req, res, next);
  },
);
apiRouter.use('/user', adminUserRouter);
apiRouter.use('/v1/codes', codeRouter);
apiRouter.use('/v1/reports', adminReportRoutes);
apiRouter.use('/v1/users', adminUsersRoutes);
apiRouter.use('/v1/user-invites', adminUserInvitesRoutes);
apiRouter.use('/v1/announcements', announcementsRoutes);
apiRouter.use('/v1/analytics', analyticRoutes);
adminApp.use(function (req: Request, res: Response, _next: NextFunction) {
  return res.status(404).send({ message: 'Route' + req.url + ' Not found.' });
});

// 500 - Any server error
adminApp.use(function (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logger.error(err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).send({ error: err });
});
export { adminApp };
