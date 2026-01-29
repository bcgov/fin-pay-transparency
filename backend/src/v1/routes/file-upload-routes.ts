import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger as log } from '../../logger.js';
import { errorService } from '../services/error-service.js';
import {
  ISubmission,
  SubmissionError,
  fileUploadService,
} from '../services/file-upload-service.js';
import { utils } from '../services/utils-service.js';

const fileUploadRouter = express.Router();
fileUploadRouter.post(
  '/',
  [
    body('companyName').exists().isString(),
    body('companyAddress').exists().isString(),
    body('naicsCode').exists().isString(),
    body('employeeCountRangeId').exists().isString(),
    body('startDate').exists().isString(),
    body('endDate').exists().isString(),
    body('reportingYear').exists().isNumeric(),
    body('dataConstraints').optional({ nullable: true }).isString(),
    body('comments').optional({ nullable: true }).isString(),
    body('rows').exists().isArray(),
  ],
  utils.asyncHandler(
    async (req: Request<null, null, null, ISubmission>, res: Response) => {
      const session: any = req?.session;
      log.info(
        `Handling file upload for correlation id: ${session?.correlationID}`,
      );

      const userInfo = utils.getSessionUser(req);
      const data: ISubmission = req.body;
      let error = null;
      try {
        const preliminaryValidationErrors = validationResult(req);
        if (!preliminaryValidationErrors.isEmpty()) {
          error = new SubmissionError(preliminaryValidationErrors.array());
          return res.status(400).json(error);
        }
        const result: any = await fileUploadService.handleSubmission(
          userInfo,
          data,
        );
        if (result instanceof SubmissionError) {
          error = result;
          return res.status(400).json(error);
        }
        return res.status(200).json(result);
      } catch {
        error = new SubmissionError('Something went wrong');
        res.status(500).json(error);
      } finally {
        if (error) errorService.storeError(userInfo, error);
      }
    },
  ),
);

export { fileUploadRouter };
