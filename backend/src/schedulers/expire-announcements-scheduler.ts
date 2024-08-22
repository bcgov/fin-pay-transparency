import { config } from '../config';
import { schedulerService } from '../v1/services/scheduler-service';
import { logger as log } from '../logger';
import advisoryLock from 'advisory-lock';
import { createJob } from './create-job';

const mutex = advisoryLock(config.get('server:databaseUrl'))(
  'expire_announcements',
);

const crontime = config.get('server:schedulerExpireAnnountmentsCronTime');

export default createJob(
  crontime,
  async () => {
    log.info('Starting expireAnnounements scheduled job.');
    await schedulerService.expireAnnouncements();
    log.info('Completed expireAnnounements scheduled job.');
  },
  mutex,
  {
    title: 'Error in expireAnnounements',
    message: 'Error running scheduled job for expireAnnounements',
  },
);
