import express from "express";
import passport from 'passport';
import { auth } from "../services/auth-service";
import { fileUploadService } from '../services/file-upload-service';

const fileUploadRouter = express.Router();
fileUploadRouter.post("/",
  passport.authenticate('jwt', { session: false }, undefined),
  auth.isValidBackendToken(),
  fileUploadService.handleFileUpload);

fileUploadRouter.get("/", passport.authenticate('jwt', { session: false }, undefined), auth.isValidBackendToken(), async (req, res) => {
  const companies = await fileUploadService.getCompanies();
  res.status(200).json(companies);
});

export { fileUploadRouter };

