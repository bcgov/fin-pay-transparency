import { config } from '../config/config.js';
import { logger as log } from '../logger.js';
import advisoryLock from 'advisory-lock';
import { createJob } from './create-job.js';
import { announcementService } from '../v1/services/announcements-service.js';

const SCHEDULER_NAME = 'DeleteAnnouncements';
const mutex = advisoryLock(config.get('server:databaseUrl'))(
  `${SCHEDULER_NAME}-lock`,
);
const crontime = config.get('server:deleteAnnouncementsCronTime');

export default createJob(
  crontime,
  async () => {
    log.info(`Starting scheduled job '${SCHEDULER_NAME}'.`);
    await announcementService.deleteAnnouncementsSchedule();
    log.info(`Completed scheduled job '${SCHEDULER_NAME}'.`);
  },
  mutex,
  {
    title: `Error in ${SCHEDULER_NAME}`,
    message: `Error in scheduled job: ${SCHEDULER_NAME}`,
  },
);
