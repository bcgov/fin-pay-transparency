import express, { NextFunction, Request, Response } from 'express';

import bodyParser from 'body-parser';
import promBundle from 'express-prom-bundle';
import { rateLimit } from 'express-rate-limit';
import session, { CookieOptions } from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import noCache from 'nocache';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import passportOIDCKCIdp from 'passport-openidconnect-keycloak-idp';
import { resolve } from 'node:path';
import prom from 'prom-client';
import fileSessionStore from 'session-file-store';
import { config } from './config';
import { logger } from './logger';
import prisma from './v1/prisma/prisma-client';
import announcementRouter from './v1/routes/announcement-routes';
import codeRouter from './v1/routes/code-routes';
import { router as configRouter } from './v1/routes/config-routes';
import { fileUploadRouter } from './v1/routes/file-upload-routes';
import authRouter from './v1/routes/public-auth-routes';
import { reportRouter } from './v1/routes/report-routes';
import resourcesRoutes from './v1/routes/resources-routes';
import userRouter from './v1/routes/user-info-routes';

import { publicAuth } from './v1/services/public-auth-service';
import { utils } from './v1/services/utils-service';

import { run as startJobs } from './schedulers/run.all';
startJobs();

const MAX_CSV_FILE_SIZE_ON_DISK_BYTES =
  config.get('server:uploadFileMaxSizeBytes') || 8388608;

// The original CSV file is parsed on the frontend and converted to JSON.
// The data in JSON format is typically larger than the original CSV
// because the JSON includes extra characters (such as quotes around
// values, and square brackets around arrays).
// For example, this CSV line:
//   W,1987.7,139897.6,,70,105.57,1000
// is converted on the frontend into this JSON array:
//   ["W","1987.7","139897.6","","70","105.57","1000"]
// Due to the extra bulk of the JSON format we allow the JSON to be
// up to 50 % larger than the CSV, which is a reasonable upper bound for
// most 'realistic' data, although it's possible to craft symthetic CSV
// submissions in which the corresponding JSON is more like 100% larger
// (e.g.a CSV file in which each column is empty).
const MAX_SUBMISSION_SIZE_ON_DISK_BYTES = MAX_CSV_FILE_SIZE_ON_DISK_BYTES * 1.5;

// Express can restrict requests to a certain maximum size, but it
// measures the request transfer size as the amount of bytes transferred
// over the network with the HTTP request.  Network transfer size is
// different from size on disk, so convert the limits defined above into
// the format that Express works with.
const DISK_MB_PER_NETWORK_MB = 1.024;
const MAX_NETWORK_TRANSFER_SIZE_BYTES =
  MAX_SUBMISSION_SIZE_ON_DISK_BYTES * DISK_MB_PER_NETWORK_MB;

const register = new prom.Registry();
prom.collectDefaultMetrics({ register });
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  metricsPath: '/prom-metrics',
  promRegistry: register,
});
const app = express();
app.set('trust proxy', 1);
app.set('query parser', 'extended');
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

app.use(helmet());
app.use(noCache());

//tells the app to use json as means of transporting data
app.use(bodyParser.json({ limit: `${MAX_NETWORK_TRANSFER_SIZE_BYTES}b` }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: `${MAX_NETWORK_TRANSFER_SIZE_BYTES}b`,
  }),
);
let proxy = true;
const cookie: CookieOptions = {
  secure: true,
  httpOnly: true,
  //maxAge: 30 minutes in ms. this is same as session time.
  //DO NOT MODIFY, IF MODIFIED, MAKE SURE SAME AS SESSION TIME OUT VALUE.
  maxAge: 1800000,
  //sameSite: 'strict' would be preferable, but it complicates the
  //authentication code flow of the login process (because the callback
  //url is issued by the identify provider, which is a third party so the
  //browser doesn't pass the cookie to the callback endpoint).
  //'lax' is a middle ground that will
  sameSite: 'lax',
};
if ('local' === config.get('environment')) {
  cookie.secure = false;
  proxy = false;
}

//sets cookies for security purposes (prevent cookie access, allow secure connections only, etc)
const sess = {
  name: 'fin_pay_transparency_cookie',
  secret: config.get('oidc:clientSecret'),
  resave: false,
  saveUninitialized: true,
  cookie: cookie,
  proxy,
  store: new fileSession({
    path: resolve('./', config.get('server:sessionPath')),
    logFn: (msg: string) => {
      logger.silly(msg);
    },
  }),
};
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
        profile.jwtFrontend = publicAuth.generateFrontendToken();
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
void utils.getOidcDiscovery().then((discovery) => {
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
  app.use(limiter);
}
app.use(metricsMiddleware);
app.get(
  '/metrics',
  utils.asyncHandler(async (_req: Request, res: Response) => {
    const prismaMetrics = await prisma.$metrics.prometheus();
    const appMetrics = await register.metrics();
    res.end(prismaMetrics + appMetrics);
  }),
);
app.get(
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

app.use(/(\/api)?/, apiRouter);
apiRouter.get('/', (_req, res) => {
  res.sendStatus(200); // generally for route verification and health check.
});
apiRouter.use('/auth', authRouter);

// check for valid passport session and backend token for all routes below.
apiRouter.use(
  passport.authenticate('jwt', { session: false }),
  (req: Request, res: Response, next: NextFunction) => {
    publicAuth.isValidBackendToken()(req, res, next);
  },
);
apiRouter.use('/user', userRouter);
apiRouter.use('/config', configRouter);
apiRouter.use('/v1/file-upload', fileUploadRouter);
apiRouter.use('/v1/codes', codeRouter);
apiRouter.use('/v1/report', reportRouter);
apiRouter.use('/v1/announcements', announcementRouter);
apiRouter.use('/v1/resources', resourcesRoutes);

app.use(function (req: Request, res: Response, _next: NextFunction) {
  res.status(404).send({ message: 'Route' + req.url + ' Not found.' });
});

// 500 - Any server error
app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(err);
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).send({ error: err });
});
export { app };
