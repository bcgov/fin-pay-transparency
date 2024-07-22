import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import {
  DateTimeFormatter,
  LocalDateTime,
  ZoneId,
  ZonedDateTime,
  convert,
} from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { PayTransparencyUserError } from './file-upload-service';
import { Prisma } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 50;

const withStartOfDay = (input: ZonedDateTime): ZonedDateTime => {
  return input.withHour(0).withMinute(0).withSecond(0).withNano(0);
};

const inputDateTimeFormat = 'yyyy-MM-dd HH:mm';
export const inputDateTimeFormatter = DateTimeFormatter.ofPattern(
  inputDateTimeFormat,
).withLocale(Locale.ENGLISH);

const externalConsumerService = {
  /**
   * This function returns a list of objects with pagination details to support the analytics team.
   * this endpoint should not return more than 50 records at a time.
   * if limit is greater than 50, it will default to 50.
   * calling this endpoint with no limit will default to 50.
   * calling this endpoint with no offset will default to 0.
   * calling this endpoint with no start date will default to - 31 days.
   * calling this endpoint with no end date will default to now.
   * consumer is responsible for making the api call in a loop to get all the records.
   * @param startDatetime from when records needs to be fetched
   * @param endDatetime till when records needs to be fetched
   * @param offset the starting point of the records , to support pagination
   * @param limit the number of records to be fetched
   */
  async exportDataWithPagination(
    startDatetime?: string,
    endDatetime?: string,
    offset?: number,
    limit?: number,
  ) {
    const currentTime = LocalDateTime.now(ZoneId.UTC).atZone(ZoneId.UTC);
    let startDt = withStartOfDay(currentTime.minusDays(31));
    let endDt = currentTime;

    if (!limit || limit <= 0 || limit > DEFAULT_PAGE_SIZE) {
      limit = DEFAULT_PAGE_SIZE;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }

    try {
      if (startDatetime) {
        startDt = LocalDateTime.parse(
          startDatetime,
          inputDateTimeFormatter,
        ).atZone(ZoneId.UTC);

        if (startDt.isAfter(currentTime)) {
          throw new PayTransparencyUserError(
            'Start date cannot be in the future',
          );
        }
      }

      if (endDatetime) {
        endDt = LocalDateTime.parse(endDatetime, inputDateTimeFormatter)
          .atZone(ZoneId.UTC)
          .plusMinutes(1);

        if (endDt.isAfter(currentTime)) {
          throw new PayTransparencyUserError(
            'End date cannot be in the future',
          );
        }
      }
    } catch (error) {
      if (error instanceof PayTransparencyUserError) {
        throw error;
      }

      throw new PayTransparencyUserError(
        'Failed to parse dates. Please use date format YYYY-MM-dd HH:mm:ss',
      );
    }

    if (startDt.isAfter(endDt)) {
      throw new PayTransparencyUserError(
        'Start date time must be before the end date time.',
      );
    }

    const whereClause: Prisma.reports_viewWhereInput = {
      update_date: {
        gte: convert(startDt).toDate(),
        lt: convert(endDt).toDate(),
      },
    };

    /**
     * Querying the reports and their data uses 2 sql views (reports_view, calculated_data_view) that
     * are included in the Prisma schema by enabling views feature and running a db pull. The 2 views in the
     * schema were modified to add unique columns keys and relations between the projects_view and the calculated_data_view
     *
     *
     * The prisma views
     * is still in preview and we must monitor its status to mitigate risk using the following links:
     * 1) https://www.prisma.io/docs/orm/prisma-schema/data-model/views
     * 2) https://github.com/prisma/prisma/issues/17335
     *
     * The views are added to the database using a database migration script (V1.0.24__add_reports_views.sql). The
     */

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
        orderBy: [{ update_date: 'asc' }],
      });

    const totalRecordsCount = await prismaReadOnlyReplica
      .$replica()
      .reports_view.count({
        where: whereClause,
      });

    records.forEach((report) => {
      delete report.report_change_id;
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
