import { LocalDate, TemporalAdjusters, convert } from '@js-joda/core';

import { logger as log, logger } from '../../logger';
import prisma from '../prisma/prisma-client';
import {
  CalculatedAmount,
  reportCalcService,
} from '../services/report-calc-service';
import { codeService } from './code-service';
import { reportService } from './report-service';
import { IValidationError, validateService } from './validate-service';

const REPORT_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

export enum SubmissionStatus {
  Success = 'success',
  Error = 'error',
}

export interface ISubmission {
  id?: string;
  companyName: string;
  companyAddress: string;
  naicsCode: string;
  employeeCountRangeId: string;
  startDate: string;
  endDate: string;
  dataConstraints: string | null;
  comments: string | null;
  rows: any[];
}

export interface ISubmissionError {
  status: SubmissionStatus.Error;
  error: any;
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
    userInfo: any,
    submission: ISubmission,
    calculatedAmounts: CalculatedAmount[],
    correlationId: string = null,
  ): Promise<string> {
    if (correlationId) {
      logger.debug(`Saving draft report for correlation id: ${correlationId}`);
    }
    let reportId = null;
    try {
      await prisma.$transaction(async (tx) => {
        reportId = await fileUploadService.saveSubmissionAsReport(
          submission,
          userInfo,
          tx,
        );
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
    if (correlationId) {
      logger.debug(`Saved draft report for correlation id: ${correlationId}`);
    }
    return reportId;
  },

  /* 
  Saves the report body to the database.
  Returns the report_id of the new record 
  */
  async saveSubmissionAsReport(
    submission: ISubmission,
    userInfo: any,
    tx,
  ): Promise<string> {
    // Use UTC so js-doja doesn't offset the timezone based on locale
    const startDate = LocalDate.parse(submission.startDate).withDayOfMonth(1);
    const endDate = LocalDate.parse(submission.endDate)

      .with(TemporalAdjusters.lastDayOfMonth());

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
        report_start_date: convert(startDate).toDate(),
        report_end_date: convert(endDate).toDate(),
        report_status: REPORT_STATUS.DRAFT,
      },
    });

    const reportData = {
      company_id: payTransparencyCompany.company_id,
      user_id: payTransparencyUser.user_id,
      user_comment: submission?.comments,
      data_constraints: submission?.dataConstraints,
      employee_count_range_id: submission?.employeeCountRangeId,
      naics_code: submission?.naicsCode,
      revision: 1,
      report_status: REPORT_STATUS.DRAFT,
      report_start_date: convert(startDate).toDate(),
      report_end_date: convert(endDate).toDate(),
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
  Process the uploaded submission.  
  If accepted, saves as a Report, and returns a Report object.  
  If rejected due to invalid input, returns an ISubmissionError.  
  If rejected due to an unexpected backend problem, throws an
  ISubmissionError.   
  */
  async handleSubmission(
    userInfo: any,
    submission: ISubmission,
    correlationId: string = null,
  ): Promise<any | ISubmissionError> {
    const bceidBusinessGuid = userInfo?._json?.bceid_business_guid;

    const preliminaryValidationError: IValidationError | null =
      validateService.validateSubmissionBodyAndHeader(submission);
    if (preliminaryValidationError) {
      return {
        status: SubmissionStatus.Error,
        error: preliminaryValidationError as IValidationError,
      } as ISubmissionError;
    }

    try {
      const calculatedAmounts: CalculatedAmount[] =
        await reportCalcService.calculateAll(submission?.rows);
      const reportId = await fileUploadService.saveDraftReport(
        userInfo,
        submission,
        calculatedAmounts,
        correlationId,
      );
      const report = await reportService.getReportById(
        bceidBusinessGuid,
        reportId,
      );
      return report;
    } catch (err) {
      // If the error was caused by invalid user input, return it (it provides
      // helpful information to show the user about what went wrong).
      if (validateService.isIValidationError(err)) {
        return {
          status: SubmissionStatus.Error,
          error: err as IValidationError,
        } as ISubmissionError;
      } else {
        // An unexpected, internal error occurred while saving the validated data
        // to the database. Log the actual error, but return a more general error
        // that won't reveal details of the backend implementation.
        log.error(JSON.stringify(err));
        throw {
          status: SubmissionStatus.Error,
          error: {
            generalErrors: ['Something went wrong'],
          },
        } as ISubmissionError;
      }
    }
  },
};

export { PayTransparencyUserError, REPORT_STATUS, fileUploadService };
