import { LocalDateTime, ZoneId } from '@js-joda/core';
import prisma from '../prisma/prisma-client';
import { enumReportStatus } from './report-service';
import { logger } from '../../logger';

const schedulerService = {
  /*
   *    Delete draft older than 24 hours (1 day)
   *    - configurable cron time in backend/config/index.ts
   *    - deletes both draft report and associated calculated data
   *
   */
  async deleteDraftReports() {
    const delete_date =
      LocalDateTime.now(ZoneId.UTC).minusDays(1).toString() + 'Z';

    logger.info('deleteDraftReports older than : ' + delete_date);

    const reports = await prisma.pay_transparency_report.findMany({
      select: {
        report_id: true,
      },
      where: {
        report_status: enumReportStatus.Draft,
        create_date: {
          lte: delete_date,
        },
      },
    });

    if (!reports) return;

    await prisma.pay_transparency_calculated_data.deleteMany({
      where: {
        report_id: {
          in: reports.map(function (report) {
            return report['report_id'];
          }),
        },
      },
    });

    await prisma.pay_transparency_report.deleteMany({
      where: {
        report_id: {
          in: reports.map(function (report) {
            return report['report_id'];
          }),
        },
      },
    });
  },
};

export { schedulerService };
