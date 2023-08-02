const express = require("express");
const morgan = require("morgan");
const nocache = require("nocache");
const helmet = require("helmet");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const apiRouter = express.Router();
import {fileUploadRouter} from './v1/routes/file-upload-routes';
import noCache from 'nocache';
import {config} from './config';
import passport from 'passport';
import {auth} from './v1/services/auth-service';
import {utils} from './v1/services/utils-service';
import session from 'express-session';
import {resolve} from 'path';
import authRouter from './v1/routes/auth-routes';
import userRouter from './v1/routes/user-info-routes';

const {logger} = require("./logger");
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const OidcStrategy = require('passport-openidconnect-keycloak-idp').Strategy;
const fileSession = require('session-file-store')(session);
const logStream = {
  write: (message) => {
    logger.info(message);
  }
};
app.set("trust proxy", 1);
app.use(cors());
app.use(helmet());
app.use(noCache());


//tells the app to use json as means of transporting data
app.use(bodyParser.json({limit: "50mb", extended: true}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: "50mb"
}));

const cookie = {
  secure: true,
  httpOnly: true,
  maxAge: 1800000 //30 minutes in ms. this is same as session time. DO NOT MODIFY, IF MODIFIED, MAKE SURE SAME AS SESSION TIME OUT VALUE.
};
if ('local' === config.get('environment')) {
  cookie.secure = false;
}
//sets cookies for security purposes (prevent cookie access, allow secure connections only, etc)
app.use(session({
  name: 'fin_pay_transparency_cookie',
  secret: config.get('oidc:clientSecret'),
  resave: false,
  saveUninitialized: true,
  cookie: cookie,
  store: new fileSession({path: resolve('./', config.get('server:sessionPath'))}),
}));
//initialize routing and session. Cookies are now only reachable via requests (not js)
app.use(passport.initialize());
app.use(passport.session());

function addLoginPassportUse(discovery, strategyName, callbackURI, kc_idp_hint) {
  passport.use(strategyName, new OidcStrategy({
    issuer: discovery.issuer,
    authorizationURL: discovery.authorization_endpoint,
    tokenURL: discovery.token_endpoint,
    userInfoURL: discovery.userinfo_endpoint,
    clientID: config.get('oidc:clientId'),
    clientSecret: config.get('oidc:clientSecret'),
    callbackURL: callbackURI,
    scope: 'bceidbusiness',
    kc_idp_hint: kc_idp_hint
  }, (_issuer, profile, _context, idToken, accessToken, refreshToken, done) => {
    if ((typeof (accessToken) === 'undefined') || (accessToken === null) ||
      (typeof (refreshToken) === 'undefined') || (refreshToken === null)) {
      return done('No access token', null);
    }

    //set access and refresh tokens
    profile.jwtFrontend = auth.generateUiToken();
    profile.jwt = accessToken;
    profile._json = parseJwt(accessToken);
    profile.refreshToken = refreshToken;
    profile.idToken= idToken;
    return done(null, profile);
  }));
}

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

//initialize our authentication strategy
utils.getOidcDiscovery().then(discovery => {
  //OIDC Strategy is used for authorization
  addLoginPassportUse(discovery, 'oidcBusinessBceid', config.get('server:frontend') + '/api/auth/callback_business_bceid', 'keycloak_bcdevexchange_bceid');
  //JWT strategy is used for authorization
  passport.use('jwt', new JWTStrategy({
    algorithms: ['RS256'],
    // Keycloak 7.3.0 no longer automatically supplies matching client_id audience.
    // If audience checking is needed, check the following SO to update Keycloak first.
    // Ref: https://stackoverflow.com/a/53627747
    audience: config.get('server:frontend'),
    issuer: config.get('tokenGenerate:issuer'),
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.get('tokenGenerate:publicKey'),
    ignoreExpiration: true
  }, (jwtPayload, done) => {
    if ((typeof (jwtPayload) === 'undefined') || (jwtPayload === null)) {
      return done('No JWT token', null);
    }

    done(null, {
      email: jwtPayload.email,
      familyName: jwtPayload.family_name,
      givenName: jwtPayload.given_name,
      jwt: jwtPayload,
      name: jwtPayload.name,
      user_guid: jwtPayload.user_guid,
      realmRole: jwtPayload.realm_role
    });
  }));
});
//functions for serializing/deserializing users
passport.serializeUser((user, next) => next(null, user));
passport.deserializeUser((obj, next) => next(null, obj));
app.use(morgan("dev", {
  stream: logStream,
  skip: (req, _res) => {
    return req.baseUrl === "" || req.baseUrl === "/" || req.baseUrl === "/health";
  }
}));
app.use(/(\/api)?/, apiRouter);
apiRouter.get("/", (req, res, next) => {
  res.sendStatus(200);// generally for route verification and health check.
});
apiRouter.use('/auth', authRouter);
apiRouter.use('/user', userRouter);
apiRouter.use("/v1/file-upload", fileUploadRouter);
export {app};
