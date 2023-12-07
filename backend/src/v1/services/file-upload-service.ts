import { Readable } from 'stream';
import { config } from "../../config";
import prisma from '../prisma/prisma-client';
import { CalculatedAmount, reportCalcService } from "../services/report-calc-service";
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

  async saveDraftReport(body, calculatedData) {

  },

  async handleFileUpload(req, res, next) {
    console.log("handleFileUpload");
    // Process the multipart form data and use the multer library's
    // built-in checks to perform a preliminary validation of the
    // uploaded file (ensure file size is within the allowed limit)

    parseMultipartFormData(req, res, async (err) => {
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
      // the contents of the uploaded file. (Note: this statement causes response 
      // status to be set and error data to be added to the response if any 
      // validation error is found.)
      const isValid = fileUploadServicePrivate.validateSubmission(req, res);

      if (isValid) {
        console.log("is valid")
        try {
          //add entire CSV file to Readable stream (so it can be processed asyncronously)
          const csvReadable = new Readable();
          csvReadable.push(req.file.buffer);
          csvReadable.push(null);
          const calculatedAmounts: CalculatedAmount[] = await reportCalcService.calculateAll(csvReadable);
          //await this.saveDraftReport(req.body, calculatedAmounts);
          res.sendStatus(200);
        }
        catch (err) {
          // An internal error occurred while saving the validated data to the 
          // database
          console.error(err);
          res.status(500).json({
            status: "error",
            errors: {
              generalErrors: ["Something went wrong"]
            }
          } as ValidationErrorResponse)
        }
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

