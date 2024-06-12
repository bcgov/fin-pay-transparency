import express, { Request, Response } from 'express';
import { logger } from '../../logger';
import { utils } from '../services/utils-service';
import { reportSearchService } from '../services/report-search-service';

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
    const paginatedReportsResponse = await reportSearchService.searchReport(
      offset,
      limit,
      req.query.sort as string,
      req.query.filter as string,
    );
    return res.status(200).json(paginatedReportsResponse);
  }),
);

export default router;
