import moment from 'moment';
import { Readable } from 'stream';
import { config } from "../../config";
import { logger as log } from '../../logger';
import prisma from '../prisma/prisma-client';
import { codeService } from "../services/code-service";
import { CalculatedAmount, reportCalcService } from "../services/report-calc-service";
import { FileErrors, validateService } from "../services/validate-service";
import { utils } from './utils-service';
const multer = require('multer');

const REPORT_STATUS = {
  DRAFT: "Draft",
  PUBLISHED: "Published"
};

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

/* An Error subclass to help us distinguish between unexpected internal errors
and errors caused by incorrect actions from a user */
class PayTransparencyUserError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

const fileUploadService = {
  async saveFileUpload(fileUpload) {
    return prisma.pay_transparency_company.create({ data: { ...fileUpload } });
  },

  async getCompanies() {
    return prisma.pay_transparency_company.findMany();
  },

  /* save the report body and the calculated amounts to the database */
  async saveDraftReport(req: any, calculatedAmounts: CalculatedAmount[]) {
    try {
      await prisma.$transaction(async (tx) => {
        const reportId = await fileUploadService.saveReportBody(req, tx);
        await fileUploadService.saveReportCalculations(calculatedAmounts, reportId, tx);
      });
    } catch (err) {
      if (err instanceof PayTransparencyUserError) {
        throw err; //rethrow
      }
      else {
        log.error(err);
        throw new Error('Error saving report');
      }
    }
  },

  /* 
  Saves the report body to the database.
  Returns the report_id of the new record 
  */
  async saveReportBody(req: any, tx: any): Promise<string> {
    const body = req.body;
    const userInfo = utils.getSessionUser(req);
    const startDate = moment(body.startDate, "YYYY-MM").startOf("month");
    const endDate = moment(body.startDate, "YYYY-MM").endOf("month");

    const payTransparencyUser = await tx.pay_transparency_user.findFirst({
      where: {
        bceid_user_guid: userInfo._json.bceid_user_guid,
        bceid_business_guid: userInfo._json.bceid_business_guid
      }
    });
    const payTransparencyCompany = await tx.pay_transparency_company.findFirst({
      where: {
        bceid_business_guid: userInfo._json.bceid_business_guid,
      }
    });
    const existingReport = await tx.pay_transparency_report.findFirst({
      where: {
        company_id: payTransparencyCompany.company_id,
        report_start_date: startDate,
        report_end_date: endDate
      }
    });

    const reportData = {
      company_id: payTransparencyCompany.company_id,
      user_id: payTransparencyUser.user_id,
      user_comment: body?.comments,
      data_constraints: body?.dataConstraints,
      employee_count_range_id: body?.employeeCountRangeId,
      naics_code: body?.naicsCode,
      revision: 1,
      report_status: REPORT_STATUS.DRAFT,
      report_start_date: startDate.toDate(),
      report_end_date: endDate.toDate()
    };

    if (existingReport) {
      if (existingReport.report_status != REPORT_STATUS.DRAFT) {
        throw new PayTransparencyUserError(`Cannot update a ${REPORT_STATUS.PUBLISHED} report.`);
      }

      await tx.pay_transparency_report.update({
        where: {
          report_id: existingReport.report_id,
        },
        data: Object.assign({}, reportData, { revision: existingReport.revision + 1 })
      });
      return existingReport.report_id;

    }
    else {
      const report = await tx.pay_transparency_report.create({
        data: reportData
      });
      return report.report_id;
    }
  },

  /*
  Saves the given calculated data to the database, associating it with the 
  given report id.
  */
  async saveReportCalculations(calculatedAmounts: CalculatedAmount[], reportId: string, tx) {

    if (!reportId) {
      throw new Error("Cannot save a calculation without a corresponding reportId");
    }

    const calculationCodeToIdMap = await codeService.getAllCalculationCodesAndIds();

    for (var i = 0; i < calculatedAmounts.length; i++) {
      const calculatedAmount = calculatedAmounts[i];

      const calculationCodeId = calculationCodeToIdMap[calculatedAmount.calculationCode];
      if (!calculationCodeId) {
        throw new Error(`Unknown calculation code '${calculatedAmount.calculationCode}'`);
      }

      const existing = await tx.pay_transparency_calculated_data.findFirst({
        where: {
          report_id: reportId,
          calculation_code_id: calculationCodeId
        }
      });

      if (existing) {
        await tx.pay_transparency_calculated_data.update({
          where: {
            calculated_data_id: existing.calculated_data_id
          },
          data: {
            value: calculatedAmount.value,
            is_suppressed: calculatedAmount.isSuppressed
          }
        });
      }
      else {
        await tx.pay_transparency_calculated_data.create({
          data: {
            report_id: reportId,
            calculation_code_id: calculationCodeId,
            value: calculatedAmount.value,
            is_suppressed: calculatedAmount.isSuppressed
          }
        });
      }

    };
  },

  /*
  Process the multipart form data and use the multer library's
  built-in checks to perform a preliminary validation of the
  uploaded file (ensure file size is within the allowed limit)
  */
  async handleFileUpload(req, res, next) {

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
        try {
          //add entire CSV file to Readable stream (so it can be processed asyncronously)
          const csvReadable = new Readable();
          csvReadable.push(req.file.buffer);
          csvReadable.push(null);
          const calculatedAmounts: CalculatedAmount[] = await reportCalcService.calculateAll(csvReadable);
          await fileUploadService.saveDraftReport(req, calculatedAmounts);
          res.sendStatus(200);
        }
        catch (err) {
          if (err instanceof PayTransparencyUserError) {
            // The request was somehow invalid.  Try to show the user a helpful
            // error message.
            res.status(400).json({
              status: "error",
              errors: {
                generalErrors: [err.message]
              }
            } as ValidationErrorResponse)
          }
          else {
            // An internal error occurred while saving the validated data to the
            // database.  Don't show the user the internal error message.  Instead,
            // return a non-specific general error message.
            log.error(err);
            res.status(500).json({
              status: "error",
              errors: {
                generalErrors: ["Something went wrong"]
              }
            } as ValidationErrorResponse)
          }

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

