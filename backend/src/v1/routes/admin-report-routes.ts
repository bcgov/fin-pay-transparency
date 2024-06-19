import express, { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import has from 'lodash/has';
import { BAD_REQUEST } from '../../constants';
import { logger } from '../../logger';
import { adminReportService } from '../services/admin-report-service';
import { reportService } from '../services/report-service';
import { utils } from '../services/utils-service';

const router = express.Router();
/**
 * /admin-api/v1/reports
 * Search reports with pagination and sort.
 * flexible endpoint to support filtering and sorting without any modification required to this endpoint.
 */
router.get(
  '/',
  utils.asyncHandler(async (req: Request, res: Response) => {
    logger.info('Pagination endpoint called');
    logger.silly(req.query); //log the query params at silly level
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    try {
      const paginatedReportsResponse = await adminReportService.searchReport(
        offset,
        limit,
        req.query.sort as string,
        req.query.filter as string,
      );
      return res.status(200).json(paginatedReportsResponse);
    } catch (error) {
      logger.error(error);
      return res.status(400).json(error);
    }
  }),
);

/**
 * PATCH - /admin-api/v1/reports/:id
 * Update report is_unlocked status
 * Example:  body {is_unlocked: true/false}
 */
router.patch(
  '/:id',
  utils.asyncHandler(async (req, res: Response) => {
    logger.info('Update report is_unlocked status called');
    logger.silly(req.body);
    try {
      const { body, params } = req;
      const user = utils.getSessionUser(req);
      if (!has(body, 'is_unlocked')) {
        return res
          .status(400)
          .json({ error: 'Missing field "is_unlocked" in the data' });
      }

      const report = await adminReportService.changeReportLockStatus(
        params?.id,
        user?.idir_username,
        body.is_unlocked,
      );

      return res.status(200).json(report);
    } catch (error) {
      logger.error(error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.status(400).json(error);
    }
  }),
);

/**
 * GET /admin-api/v1/reports/:report_id
 *    accepts 'pdf':
 *      Download pdf of the report for the users business
 */
router.get(
  '/:report_id',
  utils.asyncHandler(
    async (
      req: Request<{ report_id: string }, null, null, null>,
      res: Response,
    ) => {
      // params
      const reportId = req.params.report_id;

      if (req.accepts('application/pdf')) {
        const pdf: Buffer = await reportService.getReportPdf(req, reportId);
        const filename: string =
          await reportService.getReportFileName(reportId);

        if (pdf && filename) {
          res.set('Content-Type', 'application/pdf');
          res.set('Content-Disposition', `attachment; filename=${filename}`);
          return res.send(pdf);
        }
      }

      // if not enough information provided, then it is a bad request
      logger.error(BAD_REQUEST);
      return res.status(HttpStatus.BAD_REQUEST).end();
    },
  ),
);

export default router;
