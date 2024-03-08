import express, { Request, Response } from 'express';
import { logger as log } from '../../logger';
import {
  ISubmission,
  fileUploadService,
} from '../services/file-upload-service';
import { utils } from '../services/utils-service';

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
      fileUploadService.handleSubmission(userInfo, data);
    },
  ),
);

fileUploadRouter.get(
  '/',
  utils.asyncHandler(async (_req: Request, res: Response) => {
    const companies = await fileUploadService.getCompanies();
    res.status(200).json(companies);
  }),
);

export { fileUploadRouter };
