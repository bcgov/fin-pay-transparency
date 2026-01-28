import { DateTimeFormatter, LocalDate, ZoneId } from '@js-joda/core';
import advisoryLock from 'advisory-lock';
import { config } from '../config/config';
import { logger as log } from '../logger';
import { errorService } from '../v1/services/error-service';
import { createJob } from './create-job';

const SCHEDULER_NAME = 'DeleteUserErrors';
const mutex = advisoryLock(config.get('server:databaseUrl'))(
  `${SCHEDULER_NAME}-lock`,
);
const crontime = config.get('server:userErrorLogging:deleteScheduleCronTime');
const numMonthsOfErrorsToKeep = config.get(
  'server:userErrorLogging:numMonthsOfUserErrorsToKeep',
);

export default createJob(
  crontime,
  async () => {
    log.info(`Starting scheduled job '${SCHEDULER_NAME}'.`);
    const thresholdDate = LocalDate.now(ZoneId.UTC)
      .atStartOfDay(ZoneId.UTC)
      .minusMonths(numMonthsOfErrorsToKeep)
      .format(DateTimeFormatter.ISO_DATE_TIME);
    await errorService.deleteErrorsOlderThan(thresholdDate);
    log.info(`Completed scheduled job '${SCHEDULER_NAME}'.`);
  },
  mutex,
  {
    title: `Error in ${SCHEDULER_NAME}`,
    message: `Error in scheduled job: ${SCHEDULER_NAME}`,
  },
);
