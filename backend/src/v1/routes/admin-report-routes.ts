import express, { Request, Response } from 'express';
import { logger } from '../../logger';
import { utils } from '../services/utils-service';
import { adminReportService } from '../services/admin-report-service';
import has from 'lodash/has';

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

export default router;
