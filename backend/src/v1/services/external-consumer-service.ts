import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import {
  LocalDate,
  LocalDateTime,
  ZoneId,
  convert,
  nativeJs,
} from '@js-joda/core';
import { PayTransparencyUserError } from './file-upload-service';
import { Prisma } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 50;

const externalConsumerService = {
  /**
   * This function returns a list of objects with pagination details to support the analytics team.
   * this endpoint should not return more than 1000 records at a time.
   * if limit is greater than 1000, it will default to 1000.
   * calling this endpoint with no limit will default to 1000.
   * calling this endpoint with no offset will default to 0.
   * calling this endpoint with no start date will default to 30 days ago.
   * calling this endpoint with no end date will default to today.
   * consumer is responsible for making the api call in a loop to get all the records.
   * @param startDate from when records needs to be fetched
   * @param endDate till when records needs to be fetched
   * @param offset the starting point of the records , to support pagination
   * @param limit the number of records to be fetched
   */
  async exportDataWithPagination(
    startDate?: string,
    endDate?: string,
    offset?: number,
    limit?: number,
  ) {
    let startDt = LocalDateTime.now(ZoneId.UTC)
      .minusMonths(1)
      .withHour(0)
      .withMinute(0);
    let endDt = LocalDateTime.now(ZoneId.UTC)
      .plusDays(1)
      .withHour(0)
      .withMinute(0);
    if (!limit || limit <= 0 || limit > DEFAULT_PAGE_SIZE) {
      limit = DEFAULT_PAGE_SIZE;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }
    try {
      if (startDate) {
        const date = convert(LocalDate.parse(startDate)).toDate();
        startDt = LocalDateTime.from(nativeJs(date, ZoneId.UTC))
          .withHour(0)
          .withMinute(0);
      }

      if (endDate) {
        const date = convert(LocalDate.parse(endDate)).toDate();
        endDt = LocalDateTime.from(nativeJs(date, ZoneId.UTC))
          .withHour(23)
          .withMinute(59);
      }
    } catch (error) {
      throw new PayTransparencyUserError(
        'Failed to parse dates. Please use date format YYYY-MM-dd',
      );
    }

    if (startDt.isAfter(endDt)) {
      throw new PayTransparencyUserError(
        'Start date must be before the end date.',
      );
    }

    const whereClause: Prisma.reports_viewWhereInput = {
      update_date: {
        gte: convert(startDt).toDate(),
        lt: convert(endDt).toDate(),
      },
    };

    const records = await prismaReadOnlyReplica
      .$replica()
      .reports_view.findMany({
        where: whereClause,
        include: {
          calculated_data: {
            select: {
              value: true,
              is_suppressed: true,
              calculation_code: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { update_date: 'asc', revision: 'asc' },
      });

    const totalRecordsCount = await prismaReadOnlyReplica
      .$replica()
      .reports_view.count({
        where: whereClause,
      });

    return {
      totalRecords: totalRecordsCount,
      page: offset / limit,
      pageSize: limit,
      records,
    };
  },
};
export { externalConsumerService };
