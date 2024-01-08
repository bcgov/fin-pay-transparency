import express, {
  Express,
  NextFunction,
  Request,
  Response,
  Router,
} from 'express';

import bodyParser from 'body-parser';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import noCache from 'nocache';
import { config } from './config';
import { logger } from './logger';
import { rateLimit } from 'express-rate-limit';
import docGenRoute from './v1/routes/doc-gen-route';

const app: Express = express();
const apiRouter: Router = express.Router();

const logStream = {
  write: (message: string) => {
    logger.info(message);
  },
};

app.use(helmet());
app.use(noCache());

//tells the app to use json as means of transporting data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
  }),
);

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
app.use(compression());
app.use(/(\/api)?/, apiRouter);
apiRouter.get('/', (_req: Request, res: Response) => {
  res.sendStatus(200); // generally for route verification and health check.
});

/**
 * Global middleware to check if API KEY(x-api-key) is present in the request header and Correlation ID(x-correlation-id) is present in the request header.
 * @param req
 * @param res
 * @param next
 */
const globalMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.header('x-correlation-id');
  const apiKey = req.header('x-api-key');
  if (correlationId && apiKey) {
    if (config.get('server:apiKey') === apiKey) {
      next();
    } else {
      logger.error('Invalid API Key');
      res.status(401).send({ message: 'Invalid API Key' });
    }
  } else {
    logger.error(
      'Correlation Id or API Key is missing in the request header',
    );
    res.status(400).send({
      message: 'Correlation Id or API Key is missing in the request header',
    });
  }
};

apiRouter.use(globalMiddleware);
apiRouter.use('/doc-gen', docGenRoute);

// Handle 500
app.use((err: Error, _req: Request, res: Response) => {
  if (err?.stack) {
    logger.error(err);
  }
  res.sendStatus(500);
});

// Handle 404
app.use((_req: Request, res: Response) => {
  res.sendStatus(404);
});



export { app };
