import { LocalDateTime, ZoneId } from '@js-joda/core';
import prisma from '../prisma/prisma-client';
import { enumReportStatus } from './report-service';
import { logger as log, logger } from '../../logger';

const schedulerService = {
  /*
   *    Delete draft older than 24 hours
   *    - configurable cron time in backend/config/index.ts
   *    - deletes draft report and associated calculated data
   *
   */
  async deleteDraftReports() {
    const delete_date =
      LocalDateTime.now(ZoneId.UTC).minusHours(1).toString() + 'Z';

    logger.info(
      'schedulerService.deleteDraftReports delete_date: ' + delete_date,
    );

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

    logger.info('schedulerService.deleteDraftReports count: ' + reports.length);

    if (!reports) return;

    reports.forEach((r) => {
      logger.info(
        'schedulerService.deleteDraftReports report_id: ' + r.report_id,
      );
    });

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
