import { logger } from '../logger';
import deleteDraftReportsJob from './delete-draft-service-scheduler';
import deleteUserErrorsJob from './delete-user-errors-scheduler';
import lockReportsJob from './lock-reports-scheduler';

export const run = () => {
  try {
    deleteDraftReportsJob?.start();
    deleteUserErrorsJob?.start();
    lockReportsJob?.start();
  } catch (error) {
    /* istanbul ignore next */
    logger.error(error);
  }
};
