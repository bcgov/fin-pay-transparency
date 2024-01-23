import express, { Request, Response } from 'express';
import { fileUploadService } from '../services/file-upload-service';
import { utils } from '../services/utils-service';

const fileUploadRouter = express.Router();
fileUploadRouter.post(
  '/',
  utils.asyncHandler(fileUploadService.handleFileUpload),
);

fileUploadRouter.get(
  '/',
  utils.asyncHandler(async (_req: Request, res: Response) => {
    const companies = await fileUploadService.getCompanies();
    res.status(200).json(companies);
  }),
);

export { fileUploadRouter };
