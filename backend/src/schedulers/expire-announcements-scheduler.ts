import advisoryLock from 'advisory-lock';
import { config } from '../config/config';
import { logger as log } from '../logger';
import { announcementService } from '../v1/services/announcements-service';
import { createJob } from './create-job';

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
