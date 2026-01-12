import express, { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { logger } from '../../logger';
import { generateReport } from '../services/doc-gen-service';

const docGenRoute: Router = express.Router();

// Query params schema
const querySchema = z.object({
  reportType: z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(
      z.enum(['html', 'pdf'], {
        errorMap: () => ({
          message: 'reportType must be either "html" or "pdf"',
        }),
      }),
    ),
});

function asyncHandler(fn) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

docGenRoute.post(
  '',
  asyncHandler(async (req: Request, res: Response) => {
    const correlationId = req.header('x-correlation-id') || '';

    logger.info(
      `Generate document request received for Correlation ID: ${correlationId}`,
    );

    // Validate query params
    const queryResult = querySchema.safeParse(req.query);
    if (!queryResult.success) {
      logger.error('Query validation failed', queryResult.error.flatten());
      res.status(400).json({
        error: 'Invalid query parameters',
        details: queryResult.error.flatten(),
      });
      return;
    }

    const reportFormat = queryResult.data.reportType.toLowerCase();
    const reportData = req.body;

    try {
      const report = await generateReport(
        reportFormat,
        reportData,
        correlationId,
      );

      if (reportFormat === 'html') {
        res.setHeader('Content-Type', 'application/html');
      } else if (reportFormat === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
      }

      res.setHeader('x-correlation-id', correlationId);
      res.send(report);
    } catch (e) {
      logger.error(e);
      res.sendStatus(500);
    }
  }),
);

export default docGenRoute;
