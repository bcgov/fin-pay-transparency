import { config } from "../../config";
import prisma from '../prisma/prisma-client';
import { FileErrors, validateService } from "../services/validate-service";
const multer = require('multer');

const MAX_FILE_SIZE_BYTES = config.get('server:uploadFileMaxSizeBytes') || 8000000;
const parseMultipartFormData = multer({
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

const fileUploadService = {
  async saveFileUpload(fileUpload) {
    return prisma.pay_transparency_company.create({ data: { ...fileUpload } });
  },

  async getCompanies() {
    return prisma.pay_transparency_company.findMany();
  },

  async handleFileUpload(req, res, next) {
    console.log("handleFileUpload");
    // Process the multipart form data and use the multer library's
    // built-in checks to perform a preliminary validation of the
    // uploaded file (ensure file size is within the allowed limit)

    parseMultipartFormData(req, res, (err) => {
      if (err instanceof multer.MulterError) {

        // A default, general-purpose error message
        let errorMessage = "Invalid submission";

        // In some cases, replace the default error message with something more
        // specific.
        if (err?.code == "LIMIT_FILE_SIZE") {
          errorMessage = `The uploaded file exceeds the size limit (${MAX_FILE_SIZE_BYTES / 1000000}MB).`;
        }

        res.status(400).json({
          status: "error",
          errors: {
            generalErrors: [errorMessage]
          }
        } as ValidationErrorResponse)
        next();
        return;
      }

      // At this stage no MulterErrors were detected,
      // so start a deeper validation of the request body (form fields) and
      // the contents of the uploaded file.
      const isValid = fileUploadServicePrivate.validateSubmission(req, res);

      if (isValid) {
        // This is where the save-to-database call will go
        res.sendStatus(200);
      }

      next();
    });


  }
}

const fileUploadServicePrivate = {

  /*
  * Validates the multipart form request. If valid returns true.  Returns false
  * otherwise.  
  * Validation involves checking the request body (form fields) and also the 
  * attached file.
  * Side effects: if any validation errors were found, updates the response (res) 
  * object with appropriate status codes and return data. if no validation errors
  * were found does *not* modify the response (res).
  */
  validateSubmission(req, res) {
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
        return false;
      }
    }
    catch (e) {
      res.status(500).json({
        status: "error",
        errors: {
          generalErrors: ["Something went wrong"]
        }
      } as ValidationErrorResponse)
      return false;
    }
    return true;
  }
}

export { fileUploadService, fileUploadServicePrivate };

