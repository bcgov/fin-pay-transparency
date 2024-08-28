import waitFor from 'wait-for-expect';
import emailExpiringAnnouncementsJob from './email-expiring-announcements-scheduler';

jest.mock('../v1/services/utils-service', () => ({
  utils: {
    delay: jest.fn(),
  },
}));

const mock_sendAnnouncementExpiringEmails = jest.fn();
jest.mock('../v1/services/scheduler-service', () => ({
  schedulerService: {
    sendAnnouncementExpiringEmails: () => mock_sendAnnouncementExpiringEmails(),
  },
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
      public cb,
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
        'server:emailExpiringAnnouncementsCronTime': '121212121',
        'server:schedulerTimeZone': 'America/Vancouver',
        'ches:enabled': true,
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

describe('email-expiring-announcements-scheduler', () => {
  it("should run the 'send emails' function", async () => {
    mock_tryLock.mockReturnValue(mock_unlock);
    emailExpiringAnnouncementsJob.start();
    await waitFor(async () => {
      expect(mock_tryLock).toHaveBeenCalledTimes(1);
      expect(mock_sendAnnouncementExpiringEmails).toHaveBeenCalled();
      expect(mock_unlock).toHaveBeenCalledTimes(1);
    });
  });
});
