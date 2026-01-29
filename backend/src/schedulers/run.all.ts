import { logger } from '../logger.js';
import deleteDraftReportsJob from './delete-draft-service-scheduler.js';
import deleteUserErrorsJob from './delete-user-errors-scheduler.js';
import lockReportsJob from './lock-reports-scheduler.js';
import expireAnnouncementsJob from './expire-announcements-scheduler.js';
import emailExpiringAnnouncementsJob from './email-expiring-announcements-scheduler.js';
import deleteAnnouncementsJob from './delete-announcements-scheduler.js';

export const run = () => {
  try {
    deleteDraftReportsJob?.start();
    deleteUserErrorsJob?.start();
    lockReportsJob?.start();
    expireAnnouncementsJob?.start();
    emailExpiringAnnouncementsJob?.start();
    deleteAnnouncementsJob?.start();
  } catch (error) {
    /* istanbul ignore next */
    logger.error(error);
  }
};
