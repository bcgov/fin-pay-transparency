import { logger } from '../logger';
import deleteDraftReportsJob from './delete-draft-service-scheduler';
import lockReportsJob from './lock-reports-scheduler';

try {
  deleteDraftReportsJob.start();
  lockReportsJob.start();
} catch (error) {
  logger.error(error);
}
