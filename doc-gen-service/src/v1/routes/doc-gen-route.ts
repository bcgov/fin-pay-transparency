import express, { Request, Response, NextFunction, Router } from 'express';
import { logger } from '../../logger';
import { generateReport } from '../services/doc-gen-service';

const docGenRoute: Router = express.Router();

function asyncHandler(fn) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

docGenRoute.post(
  '',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info(
      `Generate document request received for Correlation ID: ${req.header('x-correlation-id')}`,
    );
    const reportData = req.body;
    const reportTypeQs = req.query.reportType;
    try {
      const report = await generateReport(reportTypeQs?.toString(), reportData);
      res.setHeader('Content-Type', 'application/html');
      res.setHeader('x-correlation-id', req.header('x-correlation-id'));
      res.send(report);
    } catch (e) {
      logger.error(e);
      res.sendStatus(500);
    }
  }),
);

export default docGenRoute;
