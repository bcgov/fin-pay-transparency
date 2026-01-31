import { AdvisoryLock } from './advisory-lock.js';
import { CronJob } from 'cron';
import retry from 'async-retry';
import { logger as log } from '../logger.js';
import { config } from '../config/config.js';
import { announcementService } from '../v1/services/announcements-service.js';
import { schedulerService } from '../v1/services/scheduler-service.js';
import emailService from '../external/services/ches/ches.js';
import { utils } from '../v1/services/utils-service.js';
import prisma from '../v1/prisma/prisma-client.js';

export interface JobConfig {
  name: string;
  cronTime: string;
  callback: () => Promise<void>;
}

export const JOB_CONFIGS: JobConfig[] = [
  {
    name: 'DeleteDraftReports',
    cronTime: config.get('server:schedulerDeleteDraftCronTime'),
    callback: schedulerService.deleteDraftReports,
  },
  {
    name: 'DeleteUserErrors',
    cronTime: config.get('server:userErrorLogging:deleteScheduleCronTime'),
    callback: schedulerService.deleteUserErrors,
  },
  {
    name: 'LockReports',
    cronTime: config.get('server:schedulerLockReportCronTime'),
    callback: schedulerService.lockReports,
  },
  {
    name: 'ExpireAnnouncements',
    cronTime: config.get('server:schedulerExpireAnnouncementsCronTime'),
    callback: announcementService.expireAnnouncements,
  },
  {
    name: 'EmailExpiringAnnouncements',
    cronTime: config.get('server:emailExpiringAnnouncementsCronTime'),
    callback: schedulerService.sendAnnouncementExpiringEmails,
  },
  {
    name: 'DeleteAnnouncements',
    cronTime: config.get('server:deleteAnnouncementsCronTime'),
    callback: announcementService.deleteAnnouncementsSchedule,
  },
];

const timezone = config.get('server:schedulerTimeZone');
const retryTimeout = config.get('server:retries:minTimeout');

const createJob = ({ name, cronTime, callback }: JobConfig) => {
  if (!cronTime) {
    // If cronTime is empty string, then don't create a CronJob which effectively disables the schedule
    return null;
  }
  return new CronJob(
    cronTime,
    async function () {
      const advisoryLock = new AdvisoryLock(prisma, name);
      try {
        if (await advisoryLock.tryAcquire()) {
          log.info(`Starting scheduled job '${name}'.`);
          await retry(
            async () => {
              await callback();
            },
            {
              retries: 5,
              minTimeout: retryTimeout,
            },
          );
          log.info(`Completed scheduled job '${name}'.`);
        }
      } catch (e) {
        log.error(`${name} failed.`);
        log.error(e);
        const notificationEnabled = config.get('ches:enabled');

        if (notificationEnabled) {
          const env = config.get('server:openshiftEnv');
          const hostname = config.get('server:hostName');
          const email = emailService.generateHtmlEmail(
            `Pay Transparency ${env} | Scheduled Job Error | ${name} | ${hostname}`,
            config.get('ches:emailRecipients'),
            e.message,
            e.stack,
          );
          await emailService.sendEmailWithRetry(email);
        }
      } finally {
        await utils.delay(10000);
        await advisoryLock.release();
      }
    }, // onTick
    null, // onComplete
    true, // start
    timezone, // timeZone
  );
};

export const runJobs = (jobConfigs: JobConfig[]) => {
  try {
    jobConfigs.forEach((config) => {
      const job = createJob(config);
      job?.start();
    });
  } catch (error) {
    log.error(error);
  }
};
