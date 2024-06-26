import express, { json, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import morgan from 'morgan';
import noCache from 'nocache';
import { config } from './config';
import prom from 'prom-client';
import { logger } from './logger';
import { rateLimit } from 'express-rate-limit';
import promBundle from 'express-prom-bundle';
import { utils } from './utils';
import payTransparencyRouter from './v1/routes/pay-transparency-routes';
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
      res.status(200).send('Health check passed');
    } catch (e) {
      /* istanbul ignore next  */
      logger.error(`Health check failed: ${e}`);
      /* istanbul ignore next  */
      res.status(500).send('Health check failed');
    }
  }),
);

app.use(/(\/api)?/, apiRouter);
apiRouter.get('/', (_req, res) => {
  res.sendStatus(200); // generally for route verification and health check.
});

const specs = swaggerJsdoc(utils.swaggerDocsOptions);
apiRouter.use(
  '/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true }),
);
apiRouter.use('/v1/pay-transparency/reports', payTransparencyRouter);
// Handle 500

// Handle 404
/* istanbul ignore next  */
app.use((_req: Request, res: Response) => {
  res.sendStatus(404);
});
app.use(
  /* istanbul ignore next  */
  (err: Error, _req: Request, res: Response) => {
    /* istanbul ignore if  */
    if (err?.stack) {
      logger.error(err);
    }
    res.sendStatus(500);
  },
);

export { app };
