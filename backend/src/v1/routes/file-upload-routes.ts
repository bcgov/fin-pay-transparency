import express from "express";
import passport from 'passport';
import { auth } from "../services/auth-service";
import { getCompanies } from '../services/file-upload-service';
import { validateService } from "../services/validate-service";
const multer = require('multer');
const upload = multer();

interface ValidationErrorResponse {
  status: string;
  body_errors: string[];
  file_errors: string[];
  general_errors: string[];
}

const fileUploadRouter = express.Router();
fileUploadRouter.post("/",
  passport.authenticate('jwt', { session: false }, undefined),
  auth.isValidBackendToken(),
  upload.single("file"),
  async (req, res) => {
    //await saveFileUpload(req.body);

    try {
      const bodyErrors = validateService.validateBody(req.body);
      const fileErrors = validateService.validateCsv(req.file.buffer);
      if (bodyErrors?.length || fileErrors?.length) {
        res.status(400).json({
          status: "error",
          body_errors: bodyErrors,
          file_errors: fileErrors
        } as ValidationErrorResponse)
        return;
      }
    }
    catch (e) {
      res.status(500).json({
        status: "error",
        general_errors: ["Something went wrong"]
      } as ValidationErrorResponse)
      return;
    }

    res.sendStatus(200);

  });
fileUploadRouter.get("/", passport.authenticate('jwt', { session: false }, undefined), auth.isValidBackendToken(), async (req, res) => {
  const companies = await getCompanies();
  res.status(200).json(companies);
});
export { fileUploadRouter };

