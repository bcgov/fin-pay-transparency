import express, { Request, Response } from 'express';
import has from 'lodash/has';
import Papa from 'papaparse';
import { BAD_REQUEST } from '../../constants';
import { PTRT_ADMIN_ROLE_NAME } from '../../constants/admin';
import { logger } from '../../logger';
import { authorize } from '../middlewares/authorization/authorize';
import { adminReportService } from '../services/admin-report-service';
import { PayTransparencyUserError } from '../services/file-upload-service';
import { reportService } from '../services/report-service';
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
 * Update report properties (is_unlocked and/or is_withdrawn)
 * Example:  body {is_unlocked: true/false, is_withdrawn: true}
 */
router.patch(
  '/:id',
  authorize([PTRT_ADMIN_ROLE_NAME]),
  utils.asyncHandler(async (req, res: Response) => {
    logger.info('Update report properties called');
    logger.silly(req.body);
    try {
      const { body, params } = req;
      const user = utils.getSessionUser(req);

      // Check if at least one valid property is provided
      if (!has(body, 'is_unlocked') && !has(body, 'is_withdrawn')) {
        return res.status(400).json({
          error:
            'At least one of "is_unlocked" or "is_withdrawn" must be provided',
        });
      }

      const idirGuid = user?._json?.idir_user_guid;
      if (!idirGuid) {
        return res.status(404).json({
          error: 'User IDIR GUID not found in session',
        });
      }

      // Handle withdrawal if is_withdrawn is provided
      if (has(body, 'is_withdrawn') && body.is_withdrawn === true) {
        const withdrawnReport = await adminReportService.withdrawReport(
          params?.id,
          idirGuid,
        );
        return res.status(200).json(withdrawnReport);
      }

      // Handle lock status change if is_unlocked is provided and no withdrawal
      if (has(body, 'is_unlocked')) {
        const report = await adminReportService.changeReportLockStatus(
          params?.id,
          idirGuid,
          body.is_unlocked,
        );
        return res.status(200).json(report);
      }

      // If is_withdrawn is false or not a boolean, just treat as invalid
      return res.status(400).json({
        error:
          'Invalid request. Use is_withdrawn: true to withdraw a report, or is_unlocked: true/false to change lock status.',
      });
    } catch (error) {
      logger.error(error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Report not found' });
      }
      if (error instanceof UserInputError) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Something went wrong' });
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
          await reportService.getReportFileName(reportId);
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
