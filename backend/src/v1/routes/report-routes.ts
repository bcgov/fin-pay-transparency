import express, { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { enumReportStatus, reportService } from '../services/report-service';
import { utils } from '../services/utils-service';

const reportRouter = express.Router();

/**
 * /api/v1/report/?status=<string>&report_start_date=<string>&report_end_date=<string>
 *     Get a list of reports for the company associated with the 
 *     logged in user.
 *     Optional query string params to specify filter criteria:
 *      - report_status: Optional. "Published" or "Draft"  
 *      - report_start_date: Optional. YYYY-MM-DD date string.
 *      - report_end_date: Optional. YYYY-MM-DD date string.
 *      Any specified filters are "ANDed" together.     
 */
reportRouter.get(
  '/',
  utils.asyncHandler(
    async (
      req: Request<null, null, null, { report_status?: enumReportStatus, report_start_date?: string, report_end_date?: string }>,
      res: Response,
    ) => {
      // verify business guid
      const businessGuid =
        utils.getSessionUser(req)?._json?.bceid_business_guid;
      if (!businessGuid)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();

      // params
      const status = req.query.report_status;
      const filters = req.query;

      // get reports by status if status param is provided
      try {
        const reports = await reportService.getReports(
          businessGuid,
          filters,
        );
        return res.status(HttpStatus.OK).json(reports);
      }
      catch (e) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      }
    },
  ),
);

export { reportRouter };

