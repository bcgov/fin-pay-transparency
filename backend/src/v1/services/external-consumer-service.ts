import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import { LocalDate, LocalDateTime } from '@js-joda/core';
import { logger } from '../../logger';

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
  async exportDataWithPagination(startDate: string, endDate: string, offset: number, limit: number) {
    let startDt: LocalDate;
    let endDt: LocalDate;
    if (limit > 1000 || !limit || limit <= 0) {
      limit = 1000;
    }
    if (offset < 0) {
      offset = 0;
    }
    if (startDate) {
      startDt = LocalDate.parse(startDate);
    }
    if (endDate) {
      endDt = LocalDate.parse(endDate);
    }
    // TODO: Add logic to fetch data from prismaReadOnlyReplica, below query needs to be updated.
    // Query to fetch data from report, company, calculation and calculation_code, naics_code, employee_count range tables
    const results = await prismaReadOnlyReplica.$replica().pay_transparency_report.findMany();
    logger.info(results);
    return results;

  }
};
export { externalConsumerService };
