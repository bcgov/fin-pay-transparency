import advisoryLock from 'advisory-lock';
import { CronJob } from 'cron';
import retry from 'async-retry';
import { logger as log } from '../logger';
import { config } from '../config/config';
import emailService from '../external/services/ches/ches';
import { utils } from '../v1/services/utils-service';

type CreateMutexFunction = ReturnType<typeof advisoryLock>;
type AdvisoryLock = ReturnType<CreateMutexFunction>;

interface IErrorHandlerConfig {
  title: string;
  message: string;
}

const timezone = config.get('server:schedulerTimeZone');
const retryTimeout = config.get('server:retries:minTimeout');

export const createJob = (
  cronTime: string,
  callback: () => Promise<void>,
  mutex: AdvisoryLock,
  { title, message }: IErrorHandlerConfig,
) => {
  if (!cronTime) {
    // If cronTime is empty string, then don't create a CronJob which effectively disables the schedule
    return null;
  }
  return new CronJob(
    cronTime,
    async function () {
      const unlock = await mutex.tryLock();
      try {
        if (unlock) {
          await retry(
            async () => {
              await callback();
            },
            {
              retries: 5,
              minTimeout: retryTimeout,
            },
          );
        }
      } catch (e) {
        log.error(`${title}.`);
        log.error(e);
        const notificationEnabled = config.get('ches:enabled');

        if (notificationEnabled) {
          const env = config.get('server:openshiftEnv');
          const hostname = config.get('server:hostName');
          const email = emailService.generateHtmlEmail(
            'Pay Transparency | ' + title + ' | ' + env + ' | ' + hostname,
            config.get('ches:emailRecipients'),
            message,
            e.stack,
          );
          await emailService.sendEmailWithRetry(email);
        }
      } finally {
        await utils.delay(10000);
        await unlock?.();
      }
    }, // onTick
    null, // onComplete
    true, // start
    timezone, // timeZone
  );
};
