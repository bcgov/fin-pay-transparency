import express, { json, NextFunction, Request, Response } from 'express';
import externalConsumerRouter from './v1/routes/external-consumer-routes';
import helmet from 'helmet';
import morgan from 'morgan';
import noCache from 'nocache';
import { config } from './config';
import { logger } from './logger';
import { rateLimit } from 'express-rate-limit';
const externalConsumerApp = express();
const externalConsumerApiRouter = express.Router();
const logStream = {
  write: (message) => {
    logger.info(message);
  }
};

externalConsumerApp.use(helmet());
externalConsumerApp.use(noCache());

//tells the externalConsumerApp to use json as means of transporting data
externalConsumerApp.use(json({ limit: '50mb' }));

if ('production' === config.get('environment')) {
  externalConsumerApp.set('trust proxy', 1);
}

externalConsumerApp.use(
  morgan(
    ':method | :url | :status |  :response-time ms | :req[x-correlation-id] | :res[content-length]',
    {
      stream: logStream,
      skip: (req) => {
        return (
          req.baseUrl === '' || req.baseUrl === '/' || req.baseUrl === '/health'
        );
      }
    }
  )
);

if (config.get('server:rateLimit:enabled')) {
  const limiter = rateLimit({
    windowMs: config.get('server:rateLimit:windowMs'),
    limit: config.get('server:rateLimit:limit'),
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers,
    skipSuccessfulRequests: true // Do not count successful responses
  });
  externalConsumerApp.use(limiter);
}
// The API routes are proxied from frontend, which is exposed to internet, this will avoid external consumer endpoints in backend not to be exposed to internet.
externalConsumerApp.use(/(\/external-consumer-api)?/, externalConsumerApiRouter);
externalConsumerApiRouter.use(
  (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('x-api-key');
    if (apiKey) {
      if (config.get('backendExternal:apiKey') === apiKey) {
        next();
      } else {
        logger.error('Invalid API Key');
        res.status(401).send({ message: 'Invalid API Key' });
      }
    } else {
      logger.error('API Key is missing in the request header');
      res.status(400).send({
        message: 'API Key is missing in the request header',
      });
    }
  }
);
externalConsumerApiRouter.use('/v1', externalConsumerRouter);
// Handle 500
// 404
externalConsumerApp.use(
  /* istanbul ignore next  */
  function (req: Request, res: Response, _next: NextFunction) {
    return res.status(404).send({ message: 'Route' + req.url + ' Not found.' });
  },
);

// 500 - Any server error
externalConsumerApp.use(
  /* istanbul ignore next  */
  function (err: Error, req: Request, res: Response, _next: NextFunction) {
    return res.status(500).send({ error: err });
  },
);
export { externalConsumerApp };
