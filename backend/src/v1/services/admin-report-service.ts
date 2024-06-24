import { LocalDateTime, ZoneId, convert } from '@js-joda/core';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/prisma-client';
import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import {
  FilterValidationSchema,
  RELATION_MAPPER,
  ReportFilterType,
  ReportSortType,
} from '../types/report-search';
import { PayTransparencyUserError } from './file-upload-service';

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
    let filterObj: ReportFilterType[] = [];
    if (limit < 0) {
      throw new PayTransparencyUserError('Invalid limit');
    }
    try {
      sortObj = JSON.parse(sort);
      filterObj = JSON.parse(filter);
    } catch (e) {
      throw new PayTransparencyUserError('Invalid query parameters');
    }

    await FilterValidationSchema.parseAsync(filterObj);

    const where = this.convertFiltersToPrismaFormat(filterObj);
    const orderBy = convertSortToPrismaFormat(sortObj);

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
    if (limit !== null) {
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
      update_date: 'Submission date',
      company_name: 'Company name',
      naics_code: 'NAICS code',
      employee_count_range: 'Employee count',
      reporting_year: 'Reporting year',
      is_unlocked: 'Is unlocked?',
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
   * @param idirUsername the IDIR username
   * @param isUnLocked true/false to update the is_unlocked column to
   * @returns
   */
  changeReportLockStatus: async (
    reportId: string,
    idirUsername: string,
    isUnLocked: boolean,
  ) => {
    await prisma.pay_transparency_report.findUniqueOrThrow({
      where: { report_id: reportId },
    });

    const currentDate = convert(LocalDateTime.now(ZoneId.UTC)).toDate();

    await prisma.pay_transparency_report.update({
      where: { report_id: reportId },
      data: {
        is_unlocked: isUnLocked,
        report_unlock_date: currentDate,
        idir_modified_date: currentDate,
        idir_modified_username: idirUsername,
      },
    });

    return prisma.pay_transparency_report.findUnique({
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
  },
  /**
   * Convert JSON object to Prisma specific query object
   *
   * @param filterObj
   * @returns
   */
  convertFiltersToPrismaFormat(filterObj: ReportFilterType): any {
    let prismaFilterObj: Prisma.pay_transparency_reportWhereInput = {
      report_status: 'Published',
    };

    for (const item of filterObj) {
      const relationKey = RELATION_MAPPER[item.key];
      let filterValue;
      if (item.operation === 'eq') {
        filterValue = item.value;
      } else if (item.operation === 'neq') {
        filterValue = { not: { eq: item.value } };
      } else if (item.operation === 'gt') {
        filterValue = { gt: item.value };
      } else if (item.operation === 'gte') {
        filterValue = { gte: item.value };
      } else if (item.operation === 'lt') {
        filterValue = { lt: item.value };
      } else if (item.operation === 'lte') {
        filterValue = { lte: item.value };
      } else if (item.operation === 'in') {
        filterValue = { in: item.value };
      } else if (item.operation === 'notin') {
        filterValue = { not: { in: item.value } };
      } else if (item.operation === 'between') {
        filterValue = { gte: item.value[0], lt: item.value[1] };
      } else if (item.operation === 'like') {
        filterValue = { contains: item.value, mode: 'insensitive' };
      }

      if (relationKey) {
        prismaFilterObj[relationKey] = { [item.key]: filterValue };
      } else {
        prismaFilterObj[item.key] = filterValue;
      }
    }
    return prismaFilterObj;
  },
};

const convertSortToPrismaFormat = (
  sort: ReportSortType,
): Prisma.pay_transparency_reportOrderByWithRelationInput[] => {
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
};

export { adminReportService };
