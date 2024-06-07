import { Prisma } from '@prisma/client';
import { ReportFilterType, ReportSortType } from '../../types/report_search';
import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';

const reportSearchService = {
  /**
   * Search reports, with pagination, sorting and filtering by connecting to read replica of crunchy.
   * This gives flexibility to query with pagination and filter without any modification to this service.
   * // TODO handle filters for child entities, do we need it?
   * @param page the page number to retrieve , UI page 1 is database page 0
   * @param limit the number of records to retrieve, default to 10
   * @param sort string value of JSON Array to store sort key and sort value, ex: [{"revision":"desc"},{"create_date":"asc"}]
   * @param filter string value of JSON Array for key, operation and value, ex: [{"key": "reporting_year", "operation": "eq", "value": "2024"}]
   */
  async searchReport(
    offset: number,
    limit: number,
    sort: string,
    filter: string,
  ): Promise<any> {
    offset = offset || 0;
    if (!limit || limit > 200) {
      limit = 10;
    }
    let sortObj: ReportSortType = [];
    let filterObj = {};
    try {
      sortObj = JSON.parse(sort);
      filterObj = JSON.parse(filter);
    } catch (e) {
      throw new Error('Invalid query parameters');
    }
    const where = this.convertFiltersToPrismaFormat(filterObj);
    const reports = await prismaReadOnlyReplica.pay_transparency_report.findMany({
      skip: offset,
      take: parseInt(String(limit)),
        orderBy: [{pay_transparency_company: {}}],
        where: where,
      });
    const count = await prismaReadOnlyReplica.pay_transparency_report.count({
      orderBy: sortObj,
      where: where,
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
   * Convert JSON object to Prisma specific query object
   * TODO support child entities if needed, move constants to Enum
   *
   * @param filterObj
   * @returns
   */
  convertFiltersToPrismaFormat(filterObj: ReportFilterType): any {
    let prismaFilterObj: Prisma.pay_transparency_reportWhereInput = {};

    for (const item of filterObj) {
      if (item.operation === 'eq') {
        prismaFilterObj[item.key] = item.value;
      } else if (item.operation === 'neq') {
        prismaFilterObj[item.key] = { not: { equals: item.value } };
      } else if (item.operation === 'gt') {
        prismaFilterObj[item.key] = { gt: item.value };
      } else if (item.operation === 'gte') {
        prismaFilterObj[item.key] = { gte: item.value };
      } else if (item.operation === 'lt') {
        prismaFilterObj[item.key] = { lt: item.value };
      } else if (item.operation === 'lte') {
        prismaFilterObj[item.key] = { lte: item.value };
      } else if (item.operation === 'in') {
        prismaFilterObj[item.key] = { in: item.value };
      } else if (item.operation === 'notin') {
        prismaFilterObj[item.key] = { not: { in: item.value } };
      } else if (item.operation === 'between') {
        prismaFilterObj[item.key] = { gte: item.value[0], lt: item.value[1] };
      }
    }
    return prismaFilterObj;
  },
};
export { reportSearchService };
