import express, { Request, Response } from 'express';
import { logger as log } from '../../logger';
import {
  ISubmission,
  SubmissionError,
  fileUploadService,
} from '../services/file-upload-service';
import { utils } from '../services/utils-service';
import { errorService } from '../services/error-service';

const fileUploadRouter = express.Router();
fileUploadRouter.post(
  '/',
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
        const result: any = await fileUploadService.handleSubmission(
          userInfo,
          data,
        );
        if (result instanceof SubmissionError) {
          error = result;
          return res.status(400).json(error);
        }
        return res.status(200).json(result);
      } catch (err) {
        error = new SubmissionError('Something went wrong');
        res.status(500).json(error);
      } finally {
        if (error) errorService.storeError(userInfo, error);
      }
    },
  ),
);

export { fileUploadRouter };
