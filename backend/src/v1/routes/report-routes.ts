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
  passport.authenticate('jwt', { session: false }, undefined),
  utils.asyncHandler(auth.isValidBackendToken()),
  utils.asyncHandler(
    async (
      req: Request<{ report_id: string }, null, null, null>,
      res: Response,
    ) => {
      // verifiy business guid
      const businessGuid =
        utils.getSessionUser(req)?._json?.bceid_business_guid;
      if (!businessGuid)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();

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
          res.send(pdf);
        }
      }

      // if not enough information provided, then it is a bad request
      else return res.status(HttpStatus.BAD_REQUEST).end();
    },
  ),
);

export { reportRouter };

