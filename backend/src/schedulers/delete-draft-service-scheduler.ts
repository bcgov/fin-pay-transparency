import { CronJob } from 'cron';
import { config } from '../config';
import { schedulerService } from '../v1/services/scheduler-service';
import { logger as log } from '../logger';

try {
  const job = new CronJob(
    config.get('server:schedulerDeleteDraftCronTime'), // cronTime
    async function () {
      await schedulerService.deleteDraftReports();
    }, // onTick
    null, // onComplete
    true, // start
    'America/Los_Angeles', // timeZone
  );
  job.start();
} catch (e) {
  log.error(e);
}
