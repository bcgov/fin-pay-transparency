import express, { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import {
  BAD_REQUEST,
  MISSING_BUSINESS_GUID_ERROR,
  REPORT_NOT_FOUND_ERROR,
  REPORT_STATUS_NOT_VALID_ERROR,
} from '../../constants';
import { logger } from '../../logger';
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
      if (!businessGuid) {
        logger.error(MISSING_BUSINESS_GUID_ERROR);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      }

      // params
      const filters = req.query;

      // get reports by status if status param is provided
      try {
        const reports = await reportService.getReports(businessGuid, filters);
        return res.status(HttpStatus.OK).json(reports);
      } catch (e) {
        logger.error(e);
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
      if (!bceidBusinessGuid) {
        logger.error(MISSING_BUSINESS_GUID_ERROR);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      }

      const reportId: string = req.params.reportId;
      const report_to_publish = await reportService.getReportById(
        bceidBusinessGuid,
        reportId,
      );

      if (!report_to_publish) {
        logger.error(`${REPORT_NOT_FOUND_ERROR}, Report ID: ${reportId}`);
        return res.status(HttpStatus.NOT_FOUND).end();
      }

      if (report_to_publish.report_status != enumReportStatus.Draft) {
        logger.error(
          `${REPORT_STATUS_NOT_VALID_ERROR}, Report ID: ${reportId} - ${report_to_publish.report_status}`,
        );
        return res.status(HttpStatus.NOT_FOUND).end();
      }

      try {
        await reportService.publishReport(report_to_publish);
        const reportHtml = await reportService.getReportHtml(req, reportId);
        res.type('html').status(200).send(reportHtml);
      } catch (e) {
        logger.error(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      }
    },
  ),
);

/**
 * /api/v1/report/:report_id
 *    accepts 'json':
 *      Get the input form data for a report in the users business
 *
 *    accepts 'html':
 *      Get an html preview of the report for the users business
 *
 *    accepts 'pdf':
 *      Download pdf of the report for the users business
 */
reportRouter.get(
  '/:report_id',
  utils.asyncHandler(
    async (
      req: Request<{ report_id: string }, null, null, null>,
      res: Response,
    ) => {
      // verifiy business guid
      const businessGuid =
        utils.getSessionUser(req)?._json?.bceid_business_guid;
      if (!businessGuid) {
        logger.error(MISSING_BUSINESS_GUID_ERROR);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      }

      // params
      const reportId = req.params.report_id;

      //accepts 'json'
      if (req.accepts('application/json')) {
        // get reports by status if status param is provided
        const report = await reportService.getReportById(
          businessGuid,
          reportId,
        );
        if (report) return res.status(HttpStatus.OK).json(report);
      }
      //accepts 'html'
      else if (req.accepts('text/html')) {
        const html = await reportService.getReportHtml(req, reportId);
        if (html) return res.set('Content-Type', 'text/html').send(html);
      }
      //accepts 'pdf'
      else if (req.accepts('application/pdf')) {
        const pdf: Buffer = await reportService.getReportPdf(req, reportId);
        const filename: string = await reportService.getReportFileName(
          businessGuid,
          reportId,
        );

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

export { reportRouter };
