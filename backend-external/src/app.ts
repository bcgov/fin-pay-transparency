import express, { json, NextFunction, Request, Response } from 'express';

import helmet from 'helmet';
import morgan from 'morgan';
import noCache from 'nocache';
import { config } from './config';
import prom from 'prom-client';
import prismaClient from './v1/prisma/prisma-client';
import { logger } from './logger';
import { rateLimit } from 'express-rate-limit';
import promBundle from 'express-prom-bundle';
import { utils } from './utils';

const register = new prom.Registry();
prom.collectDefaultMetrics({ register });
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  metricsPath: '/prom-metrics',
  promRegistry: register,
});
const app = express();
const apiRouter = express.Router();
const logStream = {
  write: (message) => {
    logger.info(message);
  },
};

app.use(helmet());
app.use(noCache());

//tells the app to use json as means of transporting data
app.use(json({ limit: '50mb' }));

if ('production' === config.get('environment')) {
  app.set('trust proxy', 1);
}

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
  '/health',
  utils.asyncHandler(async (_req: Request, res: Response) => {
    try {
      await prismaClient.prismaRead.$queryRaw`SELECT 1`;
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
const globalMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('x-api-key');
  if (apiKey) {
    if (config.get('server:apiKey') === apiKey) {
      next();
    } else {
      logger.error('Invalid API Key');
      res.status(401).send({ message: 'Invalid API Key' });
    }
  } else {
    logger.error('API Key is missing in the request header');
    res.status(400).send({
      message: 'Correlation Id or API Key is missing in the request header',
    });
  }
};
apiRouter.use(globalMiddleware);

export { app };
