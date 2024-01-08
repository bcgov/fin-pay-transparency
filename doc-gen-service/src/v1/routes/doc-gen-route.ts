import express, { Request, Response, Router } from 'express';
import { logger } from '../../logger';
import { generateReport } from '../services/doc-gen-service';

const docGenRoute: Router = express.Router();

docGenRoute.post('', async (req: Request, res: Response) => {
  logger.info(`Generate document request received for Correlation ID: ${req.header('x-correlation-id')}`);
  const reportData = req.body;
  const reportTypeQs = req.query.reportType;
  try {
    const report = await generateReport(reportTypeQs?.toString(), reportData);
    res.setHeader('Content-Type', 'application/html');
    res.send(report);
  } catch (e) {
    logger.error(e);
    res.sendStatus(500);
  }

});

export default docGenRoute;
