import express, { Request, Response } from 'express';
import has from 'lodash/has';
import Papa from 'papaparse';
import { BAD_REQUEST } from '../../constants';
import { logger } from '../../logger';
import { adminReportService } from '../services/admin-report-service';
import { PayTransparencyUserError } from '../services/file-upload-service';
import { utils } from '../services/utils-service';
import { UserInputError } from '../types/errors';

enum Format {
  CSV = 'text/csv',
  JSON = 'application/json',
  PDF = 'application/pdf',
}

const router = express.Router();
/**
 * /admin-api/v1/reports
 * Search reports with pagination and sort.
 * flexible endpoint to support filtering and sorting without any modification required to this endpoint.
 */
router.get(
  '/',
  utils.asyncHandler(async (req: Request, res: Response) => {
    logger.silly(req.query); //log the query params at silly level

    const outputFormat = req.accepts(Format.JSON) || req.accepts(Format.CSV);

    //The pagination behaviour of this endpoint depends on the output format.
    //Pagination is optional for CSV output, but is required for other formats.
    const isPaginationRequired = outputFormat != Format.CSV;
    const defaultLimit = isPaginationRequired ? 20 : undefined;
    const maxLimit = isPaginationRequired ? 100 : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    let limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : defaultLimit;

    if (maxLimit && limit > maxLimit) {
      limit = maxLimit;
    }

    try {
      const resultJson = await adminReportService.searchReport(
        offset,
        limit,
        req.query.sort as string,
        req.query.filter as string,
      );
      if (outputFormat == Format.JSON) {
        return res.status(200).json(resultJson);
      }
      if (outputFormat == Format.CSV) {
        // To produce a csv we start with the json format.
        // Then transform the json into a simpler object
        const simplifiedReports = resultJson?.reports.map((r) =>
          adminReportService.toHumanFriendlyReport(r),
        );

        // Convert the simplified json to csv
        const csv = Papa.unparse(simplifiedReports);
        return res
          .status(200)
          .setHeader('Content-Type', Format.CSV)
          .attachment('pay-transparency-reports.csv')
          .send(csv);
      }
      throw new Error('Unsupported format');
    } catch (error) {
      if (error instanceof PayTransparencyUserError) {
        return res.status(400).json(error);
      }
      logger.error(error);
      return res.status(500).json({ error: 'Something went wrong' });
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
        user?._json?.idir_user_guid,
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
        const pdf: Buffer = await adminReportService.getReportPdf(
          req,
          reportId,
        );
        if (!pdf) {
          return res.status(404).json({ error: 'Report not found' });
        }
        const filename: string =
          await adminReportService.getReportFileName(reportId);
        if (!filename) {
          logger.error(
            `Unable to determine PDF filename for reportId=${reportId}`,
          );
          return res.status(500).json({ error: 'Something went wrong' });
        }

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `attachment; filename=${filename}`);
        return res.send(pdf);
      }

      // if not enough information provided, then it is a bad request
      logger.error(BAD_REQUEST);
      return res
        .status(400)
        .json({ error: 'Unsupported format in accept header' });
    },
  ),
);

/**
 * GET /:report_id/admin-action-history
 * Gets a list of report snapshots which resulted from state changes
 * caused by admin users.
 */
router.get(
  '/:report_id/admin-action-history',
  utils.asyncHandler(
    async (
      req: Request<{ report_id: string }, null, null, null>,
      res: Response,
    ) => {
      // params
      const reportId = req.params.report_id;
      try {
        const adminActionHistory =
          await adminReportService.getReportAdminActionHistory(reportId);
        return res.status(200).json(adminActionHistory);
      } catch (err) {
        if (err instanceof UserInputError) {
          res.status(404).json({ error: 'Not found' });
        }
        res.status(500).json({ error: 'Something went wrong' });
      }
    },
  ),
);

export default router;
