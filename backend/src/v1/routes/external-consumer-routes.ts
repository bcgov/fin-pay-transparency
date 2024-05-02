import express, { NextFunction, Request, Response } from 'express';
import { externalConsumerService } from '../services/external-consumer-service';
import { utils } from '../services/utils-service';
import { logger } from '../../logger';
import { config } from '../../config';

const validateToken =
  (validApiKey: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('x-api-key');
    if (apiKey) {
      if (validApiKey === apiKey) {
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
  };

const router = express.Router();

router.get(
  '/',
  validateToken(config.get('backendExternal:apiKey')),
  utils.asyncHandler(async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate?.toString();
      const endDate = req.query.endDate?.toString();
      const offset = Number((req.query.offset || '0').toString());
      const limit = Number((req.query.limit || '1000').toString());
      if (isNaN(offset) || isNaN(limit)) {
        return res.status(400).json({ error: 'Invalid offset or limit' });
      }
      const results = await externalConsumerService.exportDataWithPagination(
        startDate,
        endDate,
        offset,
        limit,
      );
      res.status(200).json(results);
    } catch (e) {
      res.json({ error: true, message: e.message });
    }
  }),
);

router.delete(
  '/delete-reports',
  async (req, res) => {
    
    try {
      await externalConsumerService.deleteReports(req.query.companyId as string);
      res.status(200).json({ error: false, message: 'Reports deleted' });
    } catch (error) {
      res.json({ error: true, message: error.message });
    }
  },
);

export default router;
