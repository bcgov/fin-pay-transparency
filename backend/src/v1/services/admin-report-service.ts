import { convert, ZonedDateTime, ZoneId } from '@js-joda/core';
import type { pay_transparency_report } from '@prisma/client';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/prisma-client';
import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import { UserInputError } from '../types/errors';
import {
  FilterValidationSchema,
  RELATION_MAPPER,
  ReportFilterType,
  ReportSortType,
} from '../types/report-search';
import { PayTransparencyUserError } from './file-upload-service';
import { enumReportStatus, reportService } from './report-service';
import { utils } from './utils-service';

interface IGetReportMetricsInput {
  reportingYear: number;
}

const adminReportService = {
  /**
   * Search reports, with pagination, sorting and filtering by connecting to read replica of crunchy.
   * This gives flexibility to query with pagination and filter without any modification to this service.
   * @param page the page number to retrieve , UI page 1 is database page 0
   * @param limit the number of records to retrieve.  if null, there is no limit.
   * @param sort string value of JSON Array to store sort key and sort value, ex: [{"create_date":"asc"}]
   * @param filter string value of JSON Array for key, operation and value, ex: [{"key": "reporting_year", "operation": "eq", "value": 2024}]
   */
  async searchReport(
    offset: number,
    limit: number | undefined,
    sort: string,
    filter: string,
  ): Promise<any> {
    offset = offset || 0;
    let sortObj: ReportSortType = [];
    let filters: ReportFilterType[] = [];
    if (limit < 0) {
      throw new PayTransparencyUserError('Invalid limit');
    }
    if (limit) {
      limit = parseInt(String(limit));
    }
    try {
      sortObj = JSON.parse(sort);
      filters = JSON.parse(filter);
    } catch (e) {
      throw new PayTransparencyUserError('Invalid query parameters');
    }

    await FilterValidationSchema.parseAsync(filters);

    filters = utils.convertIsoDateStringsToUtc(filters, 'value');

    const where = this.convertFiltersToPrismaFormat(filters);

    const orderBy =
      adminReportServicePrivate.convertSortToPrismaFormat(sortObj);

    const query = {
      skip: offset,
      orderBy,
      where,
      include: {
        employee_count_range: true,
        pay_transparency_company: {
          select: {
            company_id: true,
            company_name: true,
          },
        },
      },
    };
    if (limit) {
      query['take'] = parseInt(String(limit));
    }

    const reports =
      await prismaReadOnlyReplica.pay_transparency_report.findMany(query);
    const count = await prismaReadOnlyReplica.pay_transparency_report.count({
      where,
    });

    return {
      reports,
      offset,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    };
  },

  /*
  This function is designed to accept a 'report' object in the same form
  as is returned by searchReport.  It creates a new report object with
  a flattened structure, a subset of attributes (only the most important ones),
  and human-friendly names given to those attributes.
  */
  toHumanFriendlyReport(report: any) {
    //created a flattened copy of the original object (i.e. one in which
    //none of the attributes values of type 'object')
    const flattened = { ...report };
    flattened.employee_count_range =
      report?.employee_count_range?.employee_count_range;
    flattened.company_name = report?.pay_transparency_company?.company_name;

    // Convert the boolean "true" and "false" values into "Yes" and "No"
    flattened['is_unlocked'] = flattened['is_unlocked'] ? 'Yes' : 'No';
    const attrsToRename = {
      create_date: 'Submission Date',
      company_name: 'Employer Name',
      naics_code: 'NAICS Code',
      employee_count_range: 'Employee Count',
      reporting_year: 'Reporting Year',
      is_unlocked: 'Is Unlocked',
    };
    const simplified = {};

    // Copy a subset of the attributes from the flattened object into
    // a new object.  Rename those copied attributes to have more
    // human friendly names (with appropriate capitalization, and without
    // underscores)
    Object.keys(attrsToRename).forEach((oldAttr) => {
      const newAttr = attrsToRename[oldAttr];
      simplified[newAttr] = flattened[oldAttr];
    });

    return simplified;
  },

  /**
   * Set report as locked/unlocked
   * @param reportId the id of the report
   * @param idirGuid the IDIR guid
   * @param isUnLocked true/false to update the is_unlocked column to
   * @returns
   */
  async changeReportLockStatus(
    reportId: string,
    idirGuid: string,
    isUnLocked: boolean,
  ): Promise<pay_transparency_report> {
    let updatedReport = null;
    await prisma.$transaction(async (tx) => {
      const existingReport =
        await prisma.pay_transparency_report.findUniqueOrThrow({
          where: { report_id: reportId },
        });

      const currentDateUtc = convert(ZonedDateTime.now(ZoneId.UTC)).toDate();

      await reportService.copyPublishedReportToHistory(tx, existingReport);

      await prisma.pay_transparency_report.update({
        where: { report_id: reportId },
        data: {
          is_unlocked: isUnLocked,
          report_unlock_date: currentDateUtc,
          admin_modified_date: currentDateUtc,
          admin_user: { connect: { idir_user_guid: idirGuid } },
        },
      });

      updatedReport = await prisma.pay_transparency_report.findUnique({
        where: { report_id: reportId },
        include: {
          employee_count_range: true,
          pay_transparency_company: {
            select: {
              company_id: true,
              company_name: true,
            },
          },
        },
      });
    });
    return updatedReport;
  },

  /**
   * Gets a list of admin user actions that have updated a report with a given id.
   * Currently, the only supported admin actions are locking and unlocking,
   * so every item returned describes a lock or unlock event.
   * @param req
   * @param reportId
   * @returns
   */
  async getReportAdminActionHistory(reportId: string) {
    const select = {
      is_unlocked: true,
      admin_modified_date: true,
      admin_user: {
        select: {
          admin_user_id: true,
          display_name: true,
        },
      },
    };
    const existingReport = await prisma.pay_transparency_report.findUnique({
      where: { report_id: reportId },
      select: select,
    });
    if (!existingReport) {
      throw new UserInputError('Not found');
    }

    const adminActionHistory = await prisma.report_history.findMany({
      where: {
        report_id: reportId,
        //admin_modified_date > update_date means the record was last updated
        //by an admin user (not the employer)
        admin_modified_date: {
          gt: prisma.report_history.fields.update_date,
        },
      },
      select: {
        report_history_id: true,
        ...select,
      },
      orderBy: {
        admin_modified_date: 'desc',
      },
    });

    //the current state of the report is not in the history table (it's in the
    //pay_transparency_report table).  if the current state was created as a
    //result of an admin event, add the current state to the head of the
    //adminActionHistory list.  the current state doesn't have a report_history_id
    //column, so explicitly add it and set it to null.
    const result = [...adminActionHistory];
    if (existingReport.admin_modified_date) {
      const currentState = {
        report_history_id: null,
        ...existingReport,
      };
      result.unshift(currentState);
    }

    return result;
  },

  async getReportPdf(req, reportId: string): Promise<Buffer> {
    const report = await reportService.getReportPdf(req, reportId);
    await adminReportServicePrivate.updateAdminLastAccessDate(reportId);
    return report;
  },

  /**
   * Get dashboard metrics
   * @param param0
   * @returns
   */
  async getReportsMetrics({ reportingYear }: IGetReportMetricsInput) {
    const reportsCount =
      await prismaReadOnlyReplica.pay_transparency_report.count({
        where: {
          reporting_year: reportingYear,
          report_status: 'Published',
        },
      });
    return {
      report_metrics: [
        {
          reporting_year: reportingYear,
          num_published_reports: reportsCount,
        },
      ],
    };
  },

  /**
   * Convert JSON object to Prisma specific query object
   *
   * @param filterObj
   * @returns
   */
  convertFiltersToPrismaFormat(filterObj: ReportFilterType): any {
    const prismaFilterObj: Prisma.pay_transparency_reportWhereInput = {
      report_status: { not: 'Draft' },
    };

    for (const item of filterObj) {
      const relationKey = RELATION_MAPPER[item.key];
      let filterValue;
      switch (item.operation) {
        case 'eq':
          filterValue = item.value;
          break;
        case 'neq':
          filterValue = { not: { eq: item.value } };
          break;
        case 'gt':
          filterValue = { gt: item.value };
          break;
        case 'gte':
          filterValue = { gte: item.value };
          break;
        case 'lt':
          filterValue = { lt: item.value };
          break;
        case 'lte':
          filterValue = { lte: item.value };
          break;
        case 'in':
          filterValue = { in: item.value };
          break;
        case 'notin':
          filterValue = { not: { in: item.value } };
          break;
        case 'between':
          filterValue = { gte: item.value[0], lt: item.value[1] };
          break;
        case 'like':
          filterValue = { contains: item.value, mode: 'insensitive' };
          break;
        case 'not':
          filterValue = { not: item.value };
          break;
      }

      if (relationKey) {
        prismaFilterObj[relationKey] = { [item.key]: filterValue };
      } else {
        prismaFilterObj[item.key] = filterValue;
      }
    }
    return prismaFilterObj;
  },

  /**
   * Withdraw a published report by changing its status to 'Withdrawn'.
   * Only PTRT-ADMIN users should be able to call this method.
   * @param reportId - The ID of the report to withdraw
   * @param idirGuid - The IDIR GUID of the admin user performing the withdrawal
   * @returns The withdrawn report
   */
  async withdrawReport(
    reportId: string,
    idirGuid: string,
  ): Promise<pay_transparency_report> {
    // Get the admin user ID from the IDIR GUID
    const adminUser = await prisma.admin_user.findFirst({
      where: { idir_user_guid: idirGuid },
    });

    if (!adminUser) {
      throw new UserInputError('Admin user not found');
    }

    return await prisma.$transaction(async (tx) => {
      // Get the current report
      const existingReport = await tx.pay_transparency_report.findUniqueOrThrow(
        {
          where: { report_id: reportId },
        },
      );

      if (existingReport.report_status !== enumReportStatus.Published) {
        throw new UserInputError('Only published reports can be withdrawn');
      }

      // Copy the current published report to history before withdrawal
      await reportService.copyPublishedReportToHistory(tx, existingReport);

      // Update the report status to Withdrawn
      const withdrawnReport = await tx.pay_transparency_report.update({
        where: { report_id: reportId },
        data: {
          report_status: enumReportStatus.Withdrawn,
          admin_user_id: adminUser.admin_user_id,
          admin_modified_date: new Date(),
        },
      });

      return withdrawnReport;
    });
  },
};

const adminReportServicePrivate = {
  async updateAdminLastAccessDate(reportId: string) {
    const currentDate = convert(ZonedDateTime.now(ZoneId.UTC)).toDate();
    await prisma.pay_transparency_report.update({
      where: { report_id: reportId },
      data: {
        admin_last_access_date: currentDate,
      },
    });
  },

  convertSortToPrismaFormat(
    sort: ReportSortType,
  ): Prisma.pay_transparency_reportOrderByWithRelationInput[] {
    if (!sort.length) {
      return undefined;
    }

    return sort.map((item) => {
      const [field] = Object.keys(item);
      const relationKey = RELATION_MAPPER[field];
      const sortItem = { [field]: item[field] };
      if (relationKey) {
        return { [relationKey]: sortItem };
      }

      return sortItem;
    });
  },
};

export { adminReportService, adminReportServicePrivate };
