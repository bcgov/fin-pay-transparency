import { CronJob } from 'cron';
import { config } from '../config';
import { schedulerService } from '../v1/services/scheduler-service';
import { logger as log } from '../logger';
import advisoryLock from 'advisory-lock';
import retry from 'async-retry';
import emailService from '../external/services/ches';

try {
  const mutex = advisoryLock(config.get('server:databaseUrl'))(
    'delete_draft_reports'
  );
  const crontime = config.get('server:schedulerDeleteDraftCronTime');
  const timezone = config.get('server:schedulerTimeZone');

  const job = new CronJob(
    crontime, // cronTime
    async function() {
      try {
        const unlock = await mutex.tryLock();
        if (unlock) {
          await retry(async () => {
              log.info('Starting deleteDraftReports Schedule Job.');
              await schedulerService.deleteDraftReports();
              log.info('deleteDraftReports Schedule Job completed.');
              await unlock();
            },
            {
              retries: 3
            });
        }
      } catch (e) {
        log.error('Error in deleteDraftReports.');
        log.error(e);
        const notificationEnabled = config.get('ches:enabled');
        if(notificationEnabled){
          const email = emailService.generateHtmlEmail('Error in deleteDraftReports', config.get('ches:emailRecipients'), 'Error in Scheduled Job, deleteDraftReports', e.message);
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
  log.error(e);
}
