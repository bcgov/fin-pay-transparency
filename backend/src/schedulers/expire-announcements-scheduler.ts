import advisoryLock from 'advisory-lock';
import { config } from '../config/config.js';
import { logger as log } from '../logger.js';
import { announcementService } from '../v1/services/announcements-service.js';
import { createJob } from './create-job.js';

const mutex = advisoryLock(config.get('server:databaseUrl'))(
  'expire_announcements',
);

const crontime = config.get('server:schedulerExpireAnnouncementsCronTime');

export default createJob(
  crontime,
  async () => {
    log.info('Starting expireAnnouncements scheduled job.');
    await announcementService.expireAnnouncements();
    log.info('Completed expireAnnouncements scheduled job.');
  },
  mutex,
  {
    title: 'Error in expireAnnouncements',
    message: 'Error running scheduled job for expireAnnouncements',
  },
);
