import { CronJob } from 'cron';
import { config } from '../config';
import { logger as log } from '../logger';
import advisoryLock from 'advisory-lock';
import prisma from '../v1/prisma/prisma-client';
import { LocalDateTime, ZoneId, convert } from '@js-joda/core';

try {
  const mutex = advisoryLock(config.get('server:databaseUrl'))('lock_reports');
  const crontime = config.get('server:schedulerLockReportCronTime');
  const timezone = config.get('server:schedulerTimeZone');
  const reportEditDurationInDays = config.get(
    'server:reportEditDurationInDays',
  );
  const reportUnlockDurationInDays = config.get(
    'server:reportUnlockDurationInDays',
  );

  const job = new CronJob(
    crontime, // cronTime
    async function () {
      try {
        const unlock = await mutex.tryLock();
        if (unlock) {
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
          await unlock();
        }
      } catch (e) {
        /* istanbul ignore next */
        log.error('Error in lockReports.');
        /* istanbul ignore next */
        log.error(e);
      }
    }, // onTick
    null, // onComplete
    true, // start
    timezone, // timeZone
  );
  job.start();
} catch (e) {
  /* istanbul ignore next */
  log.error(e);
}
