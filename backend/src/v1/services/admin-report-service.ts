import { Prisma } from '@prisma/client';
import {
  ReportFilterType,
  ReportSortType,
  RELATION_MAPPER,
  FilterValidationSchema,
} from '../types/report-search';
import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import { PayTransparencyUserError } from './file-upload-service';
import prisma from '../prisma/prisma-client';
import { LocalDateTime, ZoneId, convert } from '@js-joda/core';

const adminReportService = {
  /**
   * Search reports, with pagination, sorting and filtering by connecting to read replica of crunchy.
   * This gives flexibility to query with pagination and filter without any modification to this service.
   * @param page the page number to retrieve , UI page 1 is database page 0
   * @param limit the number of records to retrieve, default to 10
   * @param sort string value of JSON Array to store sort key and sort value, ex: [{"create_date":"asc"}]
   * @param filter string value of JSON Array for key, operation and value, ex: [{"key": "reporting_year", "operation": "eq", "value": 2024}]
   */
  async searchReport(
    offset: number,
    limit: number,
    sort: string,
    filter: string,
  ): Promise<any> {
    offset = offset || 0;
    if (!limit || limit > 100) {
      limit = 20;
    }
    let sortObj: ReportSortType = [];
    let filterObj: ReportFilterType[] = [];
    try {
      sortObj = JSON.parse(sort);
      filterObj = JSON.parse(filter);
    } catch (e) {
      throw new PayTransparencyUserError('Invalid query parameters');
    }

    await FilterValidationSchema.parseAsync(filterObj);

    const where = this.convertFiltersToPrismaFormat(filterObj);
    const orderBy = convertSortToPrismaFormat(sortObj);

    const reports =
      await prismaReadOnlyReplica.pay_transparency_report.findMany({
        skip: offset,
        take: parseInt(String(limit)),
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
      });
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
    let prismaFilterObj: Prisma.pay_transparency_reportWhereInput = {};

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
