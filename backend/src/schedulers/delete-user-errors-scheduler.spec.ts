import waitFor from 'wait-for-expect';
import deleteUserErrorsJob from './delete-user-errors-scheduler';

jest.mock('../v1/services/utils-service', () => ({
  utils: {
    delay: jest.fn(),
  },
}));

const mockDeleteErrorsOlderThan = jest.fn();
jest.mock('../v1/services/error-service', () => ({
  errorService: {
    deleteErrorsOlderThan: (...args) => mockDeleteErrorsOlderThan(...args),
  },
}));

const mock_asyncRetry = jest.fn((fn) => fn());
jest.mock('async-retry', () => ({
  __esModule: true,
  default: async (fn) => mock_asyncRetry(fn),
}));

const mock_generateHtmlEmail = jest.fn();
const mock_sendEmailWithRetry = jest.fn();

jest.mock('../external/services/ches/ches', () => ({
  __esModule: true,
  default: {
    generateHtmlEmail: (...args) => mock_generateHtmlEmail(...args),
    sendEmailWithRetry: (...args) => mock_sendEmailWithRetry(...args),
  },
}));

jest.mock('cron', () => ({
  CronJob: class MockCron {
    constructor(
      public expression: string,
      public cb: Function,
    ) {}
    async start() {
      return this.cb();
    }
  },
}));

jest.mock('../config/config', () => ({
  config: {
    get: (key: string) => {
      const settings = {
        'server:userErrorLogging:deleteScheduleCronTime': '121212121',
        'server:userErrorLogging:numMonthsOfUserErrorsToKeep': 6,
        'server:schedulerTimeZone': 'Canada/Vancouver',
        'ches:enabled': true,
        'ches:emailRecipients': 'test@payt.io',
      };

      return settings[key];
    },
  },
}));

const mock_tryLock = jest.fn();
const mock_unlock = jest.fn();
jest.mock('advisory-lock', () => ({
  ...jest.requireActual('advisory-lock'),
  default: () => {
    return () => ({
      tryLock: () => mock_tryLock(),
    });
  },
}));

describe('delete-draft-service-scheduler', () => {
  it('should delete draft reports', async () => {
    mock_tryLock.mockReturnValue(mock_unlock);
    deleteUserErrorsJob.start();
    await waitFor(async () => {
      expect(mock_tryLock).toHaveBeenCalledTimes(1);
      expect(mockDeleteErrorsOlderThan).toHaveBeenCalled();
      expect(mock_unlock).toHaveBeenCalledTimes(1);
    });
  });
});
