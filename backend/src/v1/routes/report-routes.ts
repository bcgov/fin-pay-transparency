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
      req: Request<
        null,
        null,
        null,
        {
          report_status?: enumReportStatus;
          report_start_date?: string;
          report_end_date?: string;
        }
      >,
      res: Response,
    ) => {
      // verify business guid
      const businessGuid =
        utils.getSessionUser(req)?._json?.bceid_business_guid;
      if (!businessGuid)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();

      // params
      const filters = req.query;

      // get reports by status if status param is provided
      try {
        const reports = await reportService.getReports(businessGuid, filters);
        return res.status(HttpStatus.OK).json(reports);
      } catch (e) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      }
    },
  ),
);

/**
 * /api/v1/report/<report_id>
 *   Changes the status of the report with the given report_id
 *   from Draft to Published.  Does not allow any other properties
 *   of the report to be updated.  Only the user that created
 *   the report is allowed to change its status.  An organization can
 *   only have one published report (for a given time period). If
 *   an organization has an existing published report for the same
 *   time period as the given draft report, the existing published
 *   report will be overridden.
 */
reportRouter.put(
  '/:reportId',
  utils.asyncHandler(
    async (
      req: Request<{ reportId: string }, null, null, null>,
      res: Response,
    ) => {
      // verify business guid
      const bceidBusinessGuid =
        utils.getSessionUser(req)?._json?.bceid_business_guid;
      if (!bceidBusinessGuid)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();

      const reportId: string = req.params.reportId;
      const report_to_publish = await reportService.getReportById(
        bceidBusinessGuid,
        reportId,
      );

      if (!report_to_publish) {
        return res.status(HttpStatus.NOT_FOUND).end();
      }

      if (report_to_publish.report_status != enumReportStatus.Draft) {
        return res.status(HttpStatus.NOT_FOUND).end();
      }

      try {
        await reportService.publishReport(report_to_publish);
        const reportHtml = reportService.getReportHtml(
          bceidBusinessGuid,
          reportId,
        );
        res.type('html').status(200).send(reportHtml);
      } catch (e) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      }
    },
  ),
);

export { reportRouter };
