import express, { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { enumReportStatus, reportService } from '../services/report-service';
import { utils } from '../services/utils-service';

const reportRouter = express.Router();

/**
 * /api/v1/report/?status=<string>
 *     Get all published reports for the company associated with the logged in user.
 */
reportRouter.get(
  '/',
  utils.asyncHandler(
    async (
      req: Request<null, null, null, { status: enumReportStatus }>,
      res: Response,
    ) => {
      // verify business guid
      const businessGuid =
        utils.getSessionUser(req)?._json?.bceid_business_guid;
      if (!businessGuid)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();

      // params
      const status = req.query.status;

      // get reports by status if status param is provided
      if (status in enumReportStatus) {
        const reports = await reportService.getReportsByStatus(
          businessGuid,
          status,
        );
        return res.status(HttpStatus.OK).json(reports);
      }

      // if not enough information provided, then it is a bad request
      return res.status(HttpStatus.BAD_REQUEST).end();
    },
  ),
);

/**
 * /api/v1/report/<report_id>
 *   Changes the status of the report with the given report_id 
 *   from Draft to Published.  Does not allow any other properties 
 *   of the report to be updated.  Only the user that created
 *   the report is allowed to change its status.
 *   If there is an existing Published report, it is replaced
 *   by the new Published report.
 *   
 */
reportRouter.put(
  '/:reportId',
  utils.asyncHandler(
    async (
      req: Request<null, null, null, null>,
      res: Response,
    ) => {
      // verify business guid
      const businessGuid =
        utils.getSessionUser(req)?._json?.bceid_business_guid;
      if (!businessGuid)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();

      const report_to_publish = reportService.getReport(req?.params?.reportId);

      if (!report_to_publish) {
        return res.status(HttpStatus.NOT_FOUND).end();
      }

      if (report_to_publish.report_status != enumReportStatus.Draft) {
        return res.status(HttpStatus.NOT_FOUND).end();
      }

      // Check if there is an existing published report for the same time period
      const existing_published_reports = await reportService.getReports(
        businessGuid,
        {
          report_status: enumReportStatus.Published,
          report_start_date: report_to_publish.report_start_date,
          report_end_date: report_to_publish.report_end_date,
        },
      );

      if (existing_published_reports.length) {
        // TODO: Move the existing report to History table (and delete it from the reports table)
      }

      // TODO: Change the status of the report_to_publish from Draft to Published

      // if not enough information provided, then it is a bad request
      return res.status(HttpStatus.BAD_REQUEST).end();
    },
  ),
);

export { reportRouter };

