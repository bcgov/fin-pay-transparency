import {
  DateTimeFormatter,
  LocalDate,
  LocalDateTime,
  TemporalAccessor,
  TemporalQueries,
  ZoneId,
  ZonedDateTime,
  convert,
} from '@js-joda/core';
import prisma from '../prisma/prisma-client';
import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import { SubmissionError } from '../services/file-upload-service';
import { ValidationError } from './validate-service';

function ConvertStringToZonedISO(str: string): ZonedDateTime {
  str = str.toUpperCase().trim();
  const DATETIMEZONE_FORMATTER = DateTimeFormatter.ofPattern(
    `yyyy-MM-dd[' ']['T'][' ']HH:mm[:ss][.SSS][.S][' '][VV]`,
  );

  const dateTimeQuery = {
    queryFrom: function (temporal: TemporalAccessor) {
      if (temporal.query(TemporalQueries.zoneId()))
        return ZonedDateTime.from(temporal);
      else return LocalDateTime.from(temporal).atZone(ZoneId.UTC);
    },
  };

  return DATETIMEZONE_FORMATTER.parse(str, dateTimeQuery);
}

const errorService = {
  /**
   * Stores the errors in the database
   * @param userInfo
   * @param errors - supports classes Error, SubmissionError, ValidationError
   */
  async storeError(userInfo, errors: Error) {
    let errorArr = [];
    if (
      errors instanceof SubmissionError &&
      errors.error instanceof ValidationError
    ) {
      const bodyErrors = errors.error.bodyErrors ?? [];
      const generalErrors = errors.error.generalErrors ?? [];
      const rowErrorMessages =
        errors.error.rowErrors?.flatMap((rowError) => rowError.errorMsgs) ?? [];

      errorArr = [...bodyErrors, ...rowErrorMessages, ...generalErrors];
    } else if (errors instanceof SubmissionError) {
      errorArr = [errors.error];
    } else {
      errorArr = [errors.message];
    }

    if (errorArr.length) {
      const payTransparencyUser =
        await prismaReadOnlyReplica.pay_transparency_user.findFirst({
          where: {
            bceid_user_guid: userInfo._json.bceid_user_guid,
            bceid_business_guid: userInfo._json.bceid_business_guid,
          },
        });

      const payTransparencyCompany =
        await prismaReadOnlyReplica.pay_transparency_company.findFirst({
          where: {
            bceid_business_guid: userInfo._json.bceid_business_guid,
          },
        });

      const now = ZonedDateTime.now(ZoneId.UTC).format(
        DateTimeFormatter.ISO_DATE_TIME,
      );
      await prisma.user_error.createMany({
        data: errorArr.map((message) => ({
          user_id: payTransparencyUser.user_id,
          company_id: payTransparencyCompany.company_id,
          error: message,
          create_date: now,
        })),
      });
    }
  },

  /**
   * Retrieves the errors from the database.
   * The submitted dates are only valid up to the minute, seconds will be
   *   truncated. For example, 10:30:40 will be truncated to 10:30.
   * @param startDate - The DateTime of the first minute which will be included in the output.
   * @param endDate - The DateTime of the last minute which will be included in the output.
   *   For example, 10:59 means everything before 11:00, but not including 11:00.
   * @param pageStr - Pagination count
   * @param pageSizeStr - Number of records to retrieve
   * @returns - Pagination object
   */
  async retrieveErrors(
    startDate: string = LocalDate.now(ZoneId.UTC)
      .atStartOfDay(ZoneId.UTC)
      .minusDays(31)
      .format(DateTimeFormatter.ISO_DATE_TIME),
    endDate: string = ZonedDateTime.now(ZoneId.UTC)
      .minusMinutes(1)
      .format(DateTimeFormatter.ISO_DATE_TIME),
    pageStr: string = '0',
    pageSizeStr: string = '1000',
  ) {
    // ensure that seconds weren't provided because they are ignored.
    // and convert 'end' to be after the last provided minute.
    const start: ZonedDateTime = ConvertStringToZonedISO(startDate)
      ?.withSecond(0)
      .withNano(0);
    const end: ZonedDateTime = ConvertStringToZonedISO(endDate)
      ?.plusMinutes(1)
      .withSecond(0)
      .withNano(0);

    if (start.isAfter(end))
      throw Error('Invalid start date; start date cannot be after end date');
    if (end.isAfter(ZonedDateTime.now(ZoneId.UTC)))
      throw Error('Invalid end date; cannot specify date in future');

    const pageSize = parseInt(pageSizeStr);
    if (Number.isNaN(pageSize) || pageSize <= 0 || pageSize > 1000)
      throw Error('Invalid pageSize; must be > 0 && <= 1000');
    const page = parseInt(pageStr);
    if (Number.isNaN(page) || page < 0)
      throw Error('Invalid page; must be >= 0');

    const offset = page * pageSize;

    const records = await prismaReadOnlyReplica.user_error.findMany({
      include: { pay_transparency_company: true },
      where: {
        create_date: {
          gte: convert(start).toDate(),
          lt: convert(end).toDate(),
        },
      },
      skip: offset,
      take: pageSize,
      orderBy: [{ create_date: 'asc' }, { user_error_id: 'asc' }],
    });

    const totalRecordsCount = await prismaReadOnlyReplica.user_error.count({
      where: {
        create_date: {
          gte: convert(start).toDate(),
          lt: convert(end).toDate(),
        },
      },
    });

    return {
      totalRecords: totalRecordsCount,
      page: offset / pageSize,
      pageSize: pageSize,
      records,
    };
  },
};

export { errorService };
