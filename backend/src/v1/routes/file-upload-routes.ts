import express from "express";
import passport from 'passport';
import { auth } from "../services/auth-service";
import { getCompanies } from '../services/file-upload-service';
import { FileErrors, validateService } from "../services/validate-service";
import {config} from "../../config";
const multer = require('multer');
const upload = multer({ fileSize: config.get('server:uploadFileMaxSize') || 500000});

interface ValidationErrorResponse {
  status: string;
  errors: {
    bodyErrors: string[];
    fileErrors: FileErrors | null;
    generalErrors: string[];
  }
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
      if (bodyErrors?.length || fileErrors) {
        res.status(400).json({
          status: "error",
          errors: {
            bodyErrors: bodyErrors,
            fileErrors: fileErrors
          }
        } as ValidationErrorResponse)
        return;
      }
    }
    catch (e) {
      res.status(500).json({
        status: "error",
        errors: {
          generalErrors: ["Something went wrong"]
        }
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

