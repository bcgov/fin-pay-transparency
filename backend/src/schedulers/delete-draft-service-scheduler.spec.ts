import waitFor from 'wait-for-expect';
import deleteDraftReportsJob from './delete-draft-service-scheduler';

const mock_deleteDraftReports = jest.fn();
jest.mock('../v1/services/scheduler-service', () => ({
  schedulerService: { deleteDraftReports: () => mock_deleteDraftReports() },
}));

const mock_asyncRetry = jest.fn((fn) => fn());
jest.mock('async-retry', () => ({
  __esModule: true,
  default: async (fn) => mock_asyncRetry(fn),
}));

const mock_generateHtmlEmail = jest.fn();
const mock_sendEmailWithRetry = jest.fn();

jest.mock('../external/services/ches', () => ({
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

jest.mock('../config', () => ({
  config: {
    get: (key: string) => {
      const settings = {
        'server:schedulerDeleteDraftCronTime': '121212121',
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
  it('should delete all draft reports', async () => {
    mock_tryLock.mockReturnValue(mock_unlock);
    deleteDraftReportsJob.start();
    await waitFor(async () => {
      expect(mock_tryLock).toHaveBeenCalledTimes(1);
      expect(mock_deleteDraftReports).toHaveBeenCalled();
      expect(mock_unlock).toHaveBeenCalledTimes(1);
    });
  });
});
