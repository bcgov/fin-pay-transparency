import express from "express";
import passport from 'passport';
import { auth } from "../services/auth-service";
import { getCompanies } from '../services/file-upload-service';
import { FileErrors, validateService } from "../services/validate-service";
import {config} from "../../config";
const multer = require('multer');
const MAX_FILE_SIZE_BYTES = config.get('server:uploadFileMaxSizeBytes') || 8000000;
const handleUpload = multer({ 
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
}).single("file"); //"file" is the name of multipart form field containing the uploaded file

interface ValidationErrorResponse {
  status: string;
  errors: {
    bodyErrors: string[];
    fileErrors: FileErrors | null;
    generalErrors: string[];
  }
}

// API endpoints
// ----------------------------------------------------------------------------

const fileUploadRouter = express.Router();
fileUploadRouter.post("/",
  passport.authenticate('jwt', { session: false }, undefined),
  auth.isValidBackendToken(),  
  async (req, res, next) => {
    // Process the multipart form data and use the multer library's
    // built-in checks to perform a preliminary validation of the
    // uploaded file (ensure file size is within the allowed limit)
    handleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        
        // A default, general-purpose error message
        let errorMessage = "Invalid submission";

        // In some cases, replace the default error message with something more
        // specific.
        if (err?.code == "LIMIT_FILE_SIZE") {
          errorMessage = `The uploaded file exceeds the size limit (${MAX_FILE_SIZE_BYTES/1000000}MB).`;
        }

        res.status(400).json({
          status: "error",
          errors: {            
            generalErrors: [errorMessage]
          }
        } as ValidationErrorResponse)
        return;
      }
      // At this stage no MulterErrors were detected,
      // so start a deeper validation of the request body (form fields) and
      // the contents of the uploaded file.
      validateSubmission(req, res, onValidationSuccess);
    });
  });

fileUploadRouter.get("/", passport.authenticate('jwt', { session: false }, undefined), auth.isValidBackendToken(), async (req, res) => {
  const companies = await getCompanies();
  res.status(200).json(companies);
});

// Private helper functions
// ----------------------------------------------------------------------------

/*
 * A callback function, called if validation of the submission (body and file)
 * were successful
 */
const onValidationSuccess = (req, res) => {
  // This is where code should be added that will save the submission 
  // to the database.  For now don't save, and just return a success 
  // response
  res.sendStatus(200);
}

/*
 * Validates the multipart form request. If valid, the submission is ingested.  
 * Validation involves checking the request body (form fields) and also the 
 * attached file.
 * Side effects: if any validation errors were found, updates the response (res) 
 * object with appropriate status codes and return data. if no validation errors
 * were found does *not* modify the response (res), and calls 
 * onValidCallback(req, res).  Note: The callback function may or may not modify 
 * the response (res) object.
 */
const validateSubmission = (req, res, onValidCallback) => {
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
    onValidCallback(req, res)
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

}

export { fileUploadRouter };

export const exportedForTesting = {
  validateSubmission
}

