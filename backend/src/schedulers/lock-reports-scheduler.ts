import { CronJob } from 'cron';
import { config } from '../config';
import { logger as log } from '../logger';
import advisoryLock from 'advisory-lock';
import prisma from '../v1/prisma/prisma-client';
import { convert, LocalDateTime, ZoneId } from '@js-joda/core';
import retry from 'async-retry';
import emailService from '../external/services/ches';

const mutex = advisoryLock(config.get('server:databaseUrl'))('lock_reports');
const crontime = config.get('server:schedulerLockReportCronTime');
const timezone = config.get('server:schedulerTimeZone');
const reportEditDurationInDays = config.get('server:reportEditDurationInDays');
const reportUnlockDurationInDays = config.get(
  'server:reportUnlockDurationInDays',
);

export default new CronJob(
  crontime, // cronTime
  async function () {
    try {
      const unlock = await mutex.tryLock();
      if (unlock) {
        await retry(
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
          {
            retries: 5,
          },
        );
        await unlock();
      }
    } catch (e) {
      log.error('Error in lockReports.');
      log.error(e);
      const notificationEnabled = config.get('ches:enabled');
      if (notificationEnabled) {
        const email = emailService.generateHtmlEmail(
          'Error in lockReports',
          config.get('ches:emailRecipients'),
          'Error in Scheduled Job, lockReports',
          e.stack,
        );
        await emailService.sendEmailWithRetry(email);
      }
    }
  }, // onTick
  null, // onComplete
  true, // start
  timezone, // timeZone
);
