import { logger } from '../logger';
import deleteDraftReportsJob from './delete-draft-service-scheduler';
import deleteUserErrorsJob from './delete-user-errors-scheduler';
import lockReportsJob from './lock-reports-scheduler';
import expireAnnouncementsJob from './expire-announcements-scheduler';
import emailExpiringAnnouncementsJob from './email-expiring-announcements-scheduler';
import deleteAnnouncementsJob from './delete-announcements-scheduler';

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
