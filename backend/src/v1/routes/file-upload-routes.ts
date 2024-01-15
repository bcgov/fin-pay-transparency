import express, { Request, Response } from 'express';
import passport from 'passport';
import { auth } from '../services/auth-service';
import { fileUploadService } from '../services/file-upload-service';

const fileUploadRouter = express.Router();
fileUploadRouter.post(
  '/',
  passport.authenticate('jwt', { session: false }, undefined),
  utils.asyncHandler(auth.isValidBackendToken()),
  utils.asyncHandler(fileUploadService.handleFileUpload),
);

fileUploadRouter.get(
  '/',
  passport.authenticate('jwt', { session: false }, undefined),
  utils.asyncHandler(auth.isValidBackendToken()),
  utils.asyncHandler(async (_req: Request, res: Response) => {
    const companies = await fileUploadService.getCompanies();
    res.status(200).json(companies);
  }),
);

export { fileUploadRouter };
