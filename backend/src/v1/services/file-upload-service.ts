import moment from 'moment';
import multer from 'multer';
import { Readable } from 'stream';
import { config } from '../../config';
import { logger as log, logger } from '../../logger';
import prisma from '../prisma/prisma-client';
import {
  CalculatedAmount,
  reportCalcService,
} from '../services/report-calc-service';
import { codeService } from './code-service';
import { REPORT_DATE_FORMAT, reportService } from './report-service';
import { utils } from './utils-service';
import { FileErrors, validateService } from './validate-service';

const REPORT_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

const MAX_FILE_SIZE_BYTES =
  config.get('server:uploadFileMaxSizeBytes') || 8000000;
const parseMultipartFormData = multer({
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
}).single('file'); //"file" is the name of multipart form field containing the uploaded file

interface ValidationErrorResponse {
  status: string;
  errors: {
    bodyErrors: string[];
    fileErrors: FileErrors | null;
    generalErrors: string[];
  };
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
  async saveDraftReport(
    req,
    calculatedAmounts: CalculatedAmount[],
  ): Promise<string> {
    logger.debug(
      'Saving draft report for correlation id: ' + req?.session?.correlationID,
    );
    let reportId = null;
    try {
      await prisma.$transaction(async (tx) => {
        reportId = await fileUploadService.saveReportBody(req, tx);
        await fileUploadService.saveReportCalculations(
          calculatedAmounts,
          reportId,
          tx,
        );
      });
    } catch (err) {
      if (err instanceof PayTransparencyUserError) {
        throw err; //rethrow
      } else {
        log.error(err);
        throw new Error('Error saving report');
      }
    }
    logger.debug(
      'Saved draft report for correlation id: ' + req?.session?.correlationID,
    );
    return reportId;
  },

  /* 
  Saves the report body to the database.
  Returns the report_id of the new record 
  */
  async saveReportBody(req, tx): Promise<string> {
    const body = req.body;
    const userInfo = utils.getSessionUser(req);

    // Use UTC so moment doesn't offset the timezone based on locale
    const startDate = moment
      .utc(body.startDate, REPORT_DATE_FORMAT)
      .startOf('month');
    const endDate = moment.utc(body.endDate, REPORT_DATE_FORMAT).endOf('month');

    const payTransparencyUser = await tx.pay_transparency_user.findFirst({
      where: {
        bceid_user_guid: userInfo._json.bceid_user_guid,
        bceid_business_guid: userInfo._json.bceid_business_guid,
      },
    });

    const payTransparencyCompany = await tx.pay_transparency_company.findFirst({
      where: {
        bceid_business_guid: userInfo._json.bceid_business_guid,
      },
    });

    const existingDraftReport = await tx.pay_transparency_report.findFirst({
      where: {
        company_id: payTransparencyCompany.company_id,
        report_start_date: startDate,
        report_end_date: endDate,
        report_status: REPORT_STATUS.DRAFT,
      },
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
      report_end_date: endDate.toDate(),
    };

    if (existingDraftReport) {
      await tx.pay_transparency_report.update({
        where: {
          report_id: existingDraftReport.report_id,
        },
        data: {
          ...reportData,
          revision: parseInt(existingDraftReport.revision) + 1,
        },
      });
      return existingDraftReport.report_id;
    } else {
      const report = await tx.pay_transparency_report.create({
        data: reportData,
      });
      return report.report_id;
    }
  },

  /*
  Saves the given calculated data to the database, associating it with the 
  given report id.
  */
  async saveReportCalculations(
    calculatedAmounts: CalculatedAmount[],
    reportId: string,
    tx,
  ) {
    if (!reportId) {
      throw new Error(
        'Cannot save a calculation without a corresponding reportId',
      );
    }

    const calculationCodeToIdMap =
      await codeService.getAllCalculationCodesAndIds();

    // Fetch all existing "calculated_data" records linked to this report.
    const existingCalculatedDatas =
      await tx.pay_transparency_calculated_data.findMany({
        where: {
          report_id: reportId,
        },
      });

    const updates: any[] = [];
    const inserts: any[] = [];

    // Iterate through all the "calculated amounts".  For each, determine if there
    // is an existing DB record for it. Use that info to decide whether to update or
    // insert.
    for (let calculatedAmount of calculatedAmounts) {
      const calculationCodeId =
        calculationCodeToIdMap[calculatedAmount.calculationCode];
      if (!calculationCodeId) {
        throw new Error(
          `Unknown calculation code '${calculatedAmount.calculationCode}'`,
        );
      }

      // Check if there is an existing DB record storing a value for this calculation.
      const calculatedDatas = existingCalculatedDatas.filter(
        (d) => d.calculation_code_id == calculationCodeId,
      );
      const existing = calculatedDatas.length ? calculatedDatas[0] : null;

      // All calculated values are cast to strings before saving to the
      // database
      const calculatedValueAsString =
        calculatedAmount.value !== null
          ? calculatedAmount.value.toString()
          : null;

      if (existing) {
        updates.push({
          calculated_data_id: existing.calculated_data_id,
          value: calculatedValueAsString,
          is_suppressed: calculatedAmount.isSuppressed,
        });
      } else {
        inserts.push({
          report_id: reportId,
          calculation_code_id: calculationCodeId,
          value: calculatedValueAsString,
          is_suppressed: calculatedAmount.isSuppressed,
        });
      }
    }

    // Bulk insert
    if (inserts.length) {
      await tx.pay_transparency_calculated_data.createMany({
        data: inserts,
      });
    }

    // Bulk update
    if (updates.length) {
      // The data being updated here were derived on the backend so
      // we can assume those data are clean and are not a risk for
      // SQL injection attacks.
      await this.updateManyUnsafe(
        tx,
        updates,
        'pay_transparency_calculated_data',
        'calculated_data_id',
      );
    }
  },

  /*
  Updates multiple records in a single table with new values.
  This function exists because prisma does not offer a way to bulk update
  rows where each row is assigned a different value according its ID.
  The underlying RDBMS used for this project (Postgres) does support 
  this kind of bulk update, so this method builds a single Postgres
  statement to update multiple rows, and runs that statement with
  prisma's "raw query" functionality.
  Inspired by the code in these post: 
    - https://github.com/prisma/prisma/discussions/19765
    - https://stackoverflow.com/a/26715934

  Safety warning: This function does not "clean" any of the data values that 
  will be updated.  As such, this function should not be used to update any 
  values that were submitted directly by users (because there is a risk of 
  SQL injection attacks).  Instead, only use this function to update data 
  that is known to be clean (such as data that was derived on the backend).
  
  @param tx: a prisma transaction object
  @param updates: an array of objects of this format 
  {
    col_1_name: col_1_value,
    col_2_name: col_2_value,
    ...etc
  }
  @param tableName: name of the table to update
  @param primaryKeyCol: the name of the primary key column in the table 
  being updated (note: the primary key column must be one of the columns 
  specified in objects of the 'updates' array)
  */
  async updateManyUnsafe(
    tx,
    updates,
    tableName: string,
    primaryKeyCol: string,
  ) {
    if (!updates.length) {
      return;
    }
    const targetAlias = 't';
    const srcAlias = 's';

    const colNames = Object.keys(updates[0]);

    // A simple function to format column values for use in a SQL
    // statement.
    //   javascript null => null
    //   javascript strings are wrapped in single quotes
    //   javascript numbers, bools and other types are left "as is"
    const formatColValue = (v) => {
      if (v === null) {
        return 'null';
      }
      if (typeof v == 'string') {
        //column values of 'string' type should be quoted
        return `'${v}'`;
      }
      return v;
    };

    // Create a list of statements which copy values from source columns to
    // target columns.
    const setColumnStmts = colNames
      .filter((c) => c != primaryKeyCol)
      .map((c) => `${c} = ${srcAlias}.${c}`);

    // Convert each item in the 'updates' list into a string of this format:
    // (col_1_value, col_2_value, ...)
    const valueTuples = updates.map(
      (u) => '(' + colNames.map((c) => formatColValue(u[c])).join(', ') + ')',
    );

    // Assemble a single SQL statement to update each row identified in the
    // "updates" array.
    const sql = `
    update ${tableName} as ${targetAlias} set
    ${setColumnStmts.join(',')}
    from (values
      ${valueTuples.join(',')}
    ) as ${srcAlias}(${colNames.join(',')})
    where ${targetAlias}.${primaryKeyCol}::text = ${srcAlias}.${primaryKeyCol}::text;
    `;

    await tx.$executeRawUnsafe(sql);
  },

  /*
  Process the multipart form data and use the multer library's
  built-in checks to perform a preliminary validation of the
  uploaded file (ensure file size is within the allowed limit).
  If there are any problem, return a JSON error.  If success,
  returns an draft report in HTML format.
  */
  async handleFileUpload(req, res, next) {
    log.info(
      'Handling file upload for correlation id: ' + req?.session?.correlationID,
    );

    const bceidBusinessGuid =
      utils.getSessionUser(req)?._json?.bceid_business_guid;

    parseMultipartFormData(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        // A default, general-purpose error message
        let errorMessage = 'Invalid submission';

        // In some cases, replace the default error message with something more
        // specific.
        if (err?.code == 'LIMIT_FILE_SIZE') {
          errorMessage = `The uploaded file exceeds the size limit (${
            MAX_FILE_SIZE_BYTES / 1000000
          }MB).`;
        }
        log.error(
          `Error handling file upload for correlation_id: ${req.session?.correlationID} and error is ${err?.code}`,
        );
        res.status(400).json({
          status: 'error',
          errors: {
            generalErrors: [errorMessage],
          },
        } as ValidationErrorResponse);
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
          const calculatedAmounts: CalculatedAmount[] =
            await reportCalcService.calculateAll(csvReadable);
          const reportId = await fileUploadService.saveDraftReport(
            req,
            calculatedAmounts,
          );
          const report = await reportService.getReportById(
            bceidBusinessGuid,
            reportId,
          );
          res.status(200).json(report);
        } catch (err) {
          if (err instanceof PayTransparencyUserError) {
            // The request was somehow invalid.  Try to show the user a helpful
            // error message.
            res.status(400).json({
              status: 'error',
              errors: {
                generalErrors: [err.message],
              },
            } as ValidationErrorResponse);
          } else {
            // An internal error occurred while saving the validated data to the
            // database.  Don't show the user the internal error message.  Instead,
            // return a non-specific general error message.
            log.error(err);
            res.status(500).json({
              status: 'error',
              errors: {
                generalErrors: ['Something went wrong'],
              },
            } as ValidationErrorResponse);
          }
        }
      }

      next();
    });
  },
};

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
          status: 'error',
          errors: {
            bodyErrors: bodyErrors,
            fileErrors: fileErrors,
          },
        } as ValidationErrorResponse);
        return false;
      }
    } catch (e) {
      res.status(500).json({
        status: 'error',
        errors: {
          generalErrors: ['Something went wrong'],
        },
      } as ValidationErrorResponse);
      return false;
    }
    return true;
  },
};

export {
  PayTransparencyUserError,
  REPORT_STATUS,
  fileUploadService,
  fileUploadServicePrivate,
};
