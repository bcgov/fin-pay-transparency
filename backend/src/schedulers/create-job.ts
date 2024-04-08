import advisoryLock from 'advisory-lock';
import { CronJob } from 'cron';
import retry from 'async-retry';
import { logger as log } from '../logger';
import { config } from '../config';
import emailService from '../external/services/ches';

type CreateMutexFunction = ReturnType<typeof advisoryLock>;
type AdvisoryLock = ReturnType<CreateMutexFunction>;

interface IErrorHandlerConfig {
  title: string;
  message: string;
}

const timezone = config.get('server:schedulerTimeZone');

export const createJob = (
  cronTime: string,
  callback: () => Promise<void>,
  mutex: AdvisoryLock,
  { title, message }: IErrorHandlerConfig,
) => {
  return new CronJob(
    cronTime,
    async function () {
      const unlock = await mutex.tryLock();
      try {
        if (unlock) {
          await retry(
            async (bail) => {
              try {
                await callback();
              } catch (error) {
                bail(error);
              }
            },
            {
              retries: 5,
            },
          );
        }
      } catch (e) {
        log.error(`${title}.`);
        log.error(e);
        const notificationEnabled = config.get('ches:enabled');
        if (notificationEnabled) {
          const email = emailService.generateHtmlEmail(
            title,
            config.get('ches:emailRecipients'),
            message,
            e.stack,
          );
          await emailService.sendEmailWithRetry(email);
        }
      } finally {
        await unlock?.();
      }
    }, // onTick
    null, // onComplete
    true, // start
    timezone, // timeZone
  );
};
