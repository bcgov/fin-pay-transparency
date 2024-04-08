import { config } from '../config';
import { logger as log } from '../logger';
import advisoryLock from 'advisory-lock';
import prisma from '../v1/prisma/prisma-client';
import { convert, LocalDateTime, ZoneId } from '@js-joda/core';
import { createJob } from './create-job';

const mutex = advisoryLock(config.get('server:databaseUrl'))('lock_reports');
const crontime = config.get('server:schedulerLockReportCronTime');
const reportEditDurationInDays = config.get('server:reportEditDurationInDays');
const reportUnlockDurationInDays = config.get(
  'server:reportUnlockDurationInDays',
);

export default createJob(
  crontime,
  async () => {
    log.info('Starting report locking Schedule Job.');
    await prisma.$transaction(async (tx) => {
      await tx.pay_transparency_report.updateMany({
        data: { is_unlocked: false },
        where: {
          AND: [
            { is_unlocked: true },
            { report_status: 'Published' },
            {
              OR: [
                {
                  report_unlock_date: null,
                  create_date: {
                    lt: convert(
                      LocalDateTime.now(ZoneId.UTC).minusDays(
                        reportEditDurationInDays,
                      ),
                    ).toDate(),
                  },
                },
                {
                  report_unlock_date: {
                    not: null,
                    lt: convert(
                      LocalDateTime.now(ZoneId.UTC).minusDays(
                        reportUnlockDurationInDays,
                      ),
                    ).toDate(),
                  },
                },
              ],
            },
          ],
        },
      });
    });
    log.info('Report locking Schedule Job completed.');
  },
  mutex,
  {
    title: 'Error in lockReports',
    message: 'Error in Scheduled Job, lockReport',
  },
);
