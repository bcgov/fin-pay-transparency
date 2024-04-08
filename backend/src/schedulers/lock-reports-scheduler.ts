import { CronJob } from 'cron';
import { config } from '../config';
import { logger as log } from '../logger';
import advisoryLock from 'advisory-lock';
import prisma from '../v1/prisma/prisma-client';
import { convert, LocalDateTime, ZoneId } from '@js-joda/core';
import retry from 'async-retry';
import emailService from '../external/services/ches';
import { utils } from '../v1/services/utils-service';

try {
  const mutex = advisoryLock(config.get('server:databaseUrl'))('lock_reports');
  const crontime = config.get('server:schedulerLockReportCronTime');
  const timezone = config.get('server:schedulerTimeZone');
  const reportEditDurationInDays = config.get(
    'server:reportEditDurationInDays'
  );
  const reportUnlockDurationInDays = config.get(
    'server:reportUnlockDurationInDays'
  );

  const job = new CronJob(
    crontime, // cronTime
    async function() {
      try {
        const unlock = await mutex.tryLock();
        if (unlock) {
          await retry(async () => {
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
                                  reportEditDurationInDays
                                )
                              ).toDate()
                            }
                          },
                          {
                            report_unlock_date: {
                              not: null,
                              lt: convert(
                                LocalDateTime.now(ZoneId.UTC).minusDays(
                                  reportUnlockDurationInDays
                                )
                              ).toDate()
                            }
                          }
                        ]
                      }
                    ]
                  }
                });
              });
              log.info('Report locking Schedule Job completed.');
              await utils.delay(10000); // wait for 10 seconds before releasing the lock, to see it is executed only once
              await unlock();
            },
            {
              retries: 5
            }
          );
        }
      } catch (e) {
        /* istanbul ignore next */
        log.error('Error in lockReports.');
        /* istanbul ignore next */
        log.error(e);
        const notificationEnabled = config.get('ches:enabled');
        if(notificationEnabled){
          const email = emailService.generateHtmlEmail('Error in deleteDraftReports', config.get('ches:emailRecipients'), 'Error in Scheduled Job, deleteDraftReports', e.stack);
          await emailService.sendEmailWithRetry(email);
        }

      }
    }, // onTick
    null, // onComplete
    true, // start
    timezone // timeZone
  );
  job.start();
} catch (e) {
  /* istanbul ignore next */
  log.error(e);
}
