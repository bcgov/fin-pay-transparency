import { config } from '../config/config';
import { schedulerService } from '../v1/services/scheduler-service';
import { logger as log } from '../logger';
import advisoryLock from 'advisory-lock';
import { createJob } from './create-job';

const mutex = advisoryLock(config.get('server:databaseUrl'))(
  'delete_draft_reports',
);
const crontime = config.get('server:schedulerDeleteDraftCronTime');

export default createJob(
  crontime,
  async () => {
    log.info('Starting deleteDraftReports Schedule Job.');
    await schedulerService.deleteDraftReports();
    log.info('deleteDraftReports Schedule Job completed.');
  },
  mutex,
  {
    title: 'Error in deleteDraftReports',
    message: 'Error in Scheduled Job, deleteDraftReports',
  },
);
