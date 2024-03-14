import { CronJob } from 'cron';
import { config } from '../config';
import { schedulerService } from '../v1/services/scheduler-service';
import { logger as log } from '../logger';
import advisoryLock from 'advisory-lock';

try {
  const mutex = advisoryLock(config.get('server:databaseUrl'))('locke');
  const crontime = config.get('server:schedulerDeleteDraftCronTime');
  const timezone = config.get('server:schedulerDeleteDraftTimeZone');

  const job = new CronJob(
    crontime, // cronTime
    async function () {
      try {
        await mutex.withLock(async () => {
          schedulerService.deleteDraftReports();
        });
      } catch (e) {
        log.error(e);
      }
    }, // onTick
    null, // onComplete
    true, // start
    timezone, // timeZone
  );
  job.start();
} catch (e) {
  log.error(e);
}
