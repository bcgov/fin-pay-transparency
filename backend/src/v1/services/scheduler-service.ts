import { LocalDateTime, ZoneId } from '@js-joda/core';
import { Prisma } from '@prisma/client';
import { logger } from '../../logger';
import prisma from '../prisma/prisma-client';
import { enumReportStatus } from './report-service';

const schedulerService = {
  /*
   *    Delete draft report and associated calculated data older than 24 hours
   *    - crontime and timezone in backend/.env
   */
  async deleteDraftReports() {
    const delete_date =
      LocalDateTime.now(ZoneId.UTC).minusDays(1).toString() + 'Z';

    logger.info('Delete Draft Reports older than : ' + delete_date);

    const reportWhereClause: Prisma.pay_transparency_reportWhereInput = {
      report_status: enumReportStatus.Draft,
      create_date: {
        lte: delete_date,
      },
    };

    await prisma.$transaction(async (tx) => {
      await tx.pay_transparency_calculated_data.deleteMany({
        where: {
          pay_transparency_report: reportWhereClause,
        },
      });

      await tx.pay_transparency_report.deleteMany({
        where: reportWhereClause,
      });
    });
  },
};

export { schedulerService };
