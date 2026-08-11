import { Router, Request, Response } from 'express';
import {
  createOrUpdateReportUrlSafe,
  ReportIdType,
  reportIdSchema,
  ReportUrlType,
  reportUrlSchema,
  getHistoryForReport,
} from '../services/report-url-service.js';
import { useValidate } from '../middlewares/validations/validate.js';
import { authorize } from '../middlewares/authorization/authorize.js';
import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin.js';
import { utils } from '../services/utils-service.js';
import { logger } from '../../logger.js';

const router = Router();

/**
 * GET /:reportId/history
 * Admin-only: full audit history of report url changes for an employers report.
 */
router.get(
  '/:reportId/history',
  authorize([PTRT_USER_ROLE_NAME, PTRT_ADMIN_ROLE_NAME]),
  useValidate({ mode: 'params', schema: reportIdSchema }),
  async (req: Request<ReportIdType>, res: Response) => {
    try {
      const history = await getHistoryForReport(req.params.reportId);
      res.status(200).json(history);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

/**
 * POST report-url/:reportId
 * Create the report url for the authenticated employer's report.
 */
router.post(
  '/:reportId',
  useValidate({ mode: 'params', schema: reportIdSchema }),
  useValidate({ mode: 'body', schema: reportUrlSchema }),
  async (req: Request<ReportIdType, unknown, ReportUrlType>, res: Response) => {
    try {
      const businessGuid: string =
        utils.getSessionUser(req)?._json?.bceid_business_guid;
      const userGuid: string =
        utils.getSessionUser(req)?._json?.bceid_user_guid;
      const record = await createOrUpdateReportUrlSafe(
        req.params.reportId,
        req.body.reportUrl,
        businessGuid,
        userGuid,
      );

      res.status(201).json(record);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  },
);

export default router;
