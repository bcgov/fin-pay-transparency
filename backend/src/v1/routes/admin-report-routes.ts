import express, { Request, Response } from 'express';
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
import { z } from 'zod';

enum Format {
  CSV = 'text/csv',
  JSON = 'application/json',
  PDF = 'application/pdf',
}

/**
 * Validation schema for PATCH /admin-api/v1/reports/:id
 * Ensures:
 * - At least one property is provided
 * - At most one property is provided per call
 * - is_withdrawn can only be set to true
 * - reporting_year must be current or previous year
 */
const updateReportBodySchema = z
  .object({
    is_unlocked: z.boolean().optional(),
    is_withdrawn: z.literal(true).optional(),
    reporting_year: z.number().optional(),
  })
  .refine(
    (data) =>
      data.is_unlocked !== undefined ||
      data.is_withdrawn !== undefined ||
      data.reporting_year !== undefined,
    {
      message:
        'One of "is_unlocked", "is_withdrawn", or "reporting_year" must be provided',
    },
  )
  .refine(
    (data) => {
      const providedFieldsCount = [
        data.is_unlocked !== undefined,
        data.is_withdrawn !== undefined,
        data.reporting_year !== undefined,
      ].filter(Boolean).length;
      return providedFieldsCount <= 1;
    },
    {
      message:
        'Only one of "is_unlocked", "is_withdrawn", or "reporting_year" can be specified per call',
    },
  )
  .refine(
    (data) => {
      if (data.reporting_year === undefined) {
        return true;
      }
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      return (
        data.reporting_year === currentYear ||
        data.reporting_year === previousYear
      );
    },
    {
      message:
        'reporting_year must be either the current year or previous year',
    },
  );

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
    const offset = req.query.offset
      ? Number.parseInt(req.query.offset as string)
      : 0;
    let limit = req.query.limit
      ? Number.parseInt(req.query.limit as string)
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
 * Update report properties (is_unlocked, is_withdrawn, or reporting_year)
 * Example:  body {is_unlocked: true/false, is_withdrawn: true, reporting_year: 2023}
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

      const idirGuid = user?._json?.idir_user_guid;
      if (!idirGuid) {
        return res.status(404).json({
          error: 'User IDIR GUID not found in session',
        });
      }

      // Validate request body against schema
      const validationResult = updateReportBodySchema.safeParse(body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((e) => e.message);
        return res.status(400).json({
          error: errors.length === 1 ? errors[0] : errors,
        });
      }
      const validatedBody = validationResult.data;

      // Handle the single update operation (schema guarantees exactly one is provided)
      if (validatedBody.is_withdrawn === true) {
        const withdrawnReport = await adminReportService.withdrawReport(
          params?.id,
          idirGuid,
        );
        return res.status(200).json(withdrawnReport);
      }

      if (validatedBody.is_unlocked !== undefined) {
        const report = await adminReportService.changeReportLockStatus(
          params?.id,
          idirGuid,
          validatedBody.is_unlocked,
        );
        return res.status(200).json(report);
      }

      if (validatedBody.reporting_year !== undefined) {
        const updatedReport =
          await adminReportService.updateReportReportingYear(
            params?.id,
            idirGuid,
            validatedBody.reporting_year,
          );
        return res.status(200).json(updatedReport);
      }
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
