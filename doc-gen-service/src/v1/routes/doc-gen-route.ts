import express, { NextFunction, Request, Response, Router } from 'express';
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
      `Generate document request received for Correlation ID: ${req.header(
        'x-correlation-id',
      )}`,
    );
    const reportData = req.body;
    const reportTypeQs = req.query.reportType;
    const reportFormat = reportTypeQs?.toString().toLowerCase();

    try {
      const report = await generateReport(reportFormat, reportData);
      if (reportFormat == 'html') {
        res.setHeader('Content-Type', 'application/html');
      } else if (reportFormat == 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
      } else {
        throw new Error('Unsupported report format ' + reportTypeQs);
      }
      res.setHeader('x-correlation-id', req.header('x-correlation-id'));
      res.send(report);
    } catch (e) {
      logger.error(e);
      res.sendStatus(500);
    }
  }),
);

export default docGenRoute;
