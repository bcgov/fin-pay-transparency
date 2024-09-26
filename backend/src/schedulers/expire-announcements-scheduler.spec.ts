import waitFor from 'wait-for-expect';
import expireAnnouncementsJob from './expire-announcements-scheduler';

jest.mock('../v1/services/utils-service', () => ({
  utils: {
    delay: jest.fn(),
  },
}));

const mockExpireAnnouncements = jest.fn();
jest.mock('../v1/services/announcements-service', () => ({
  announcementService: { expireAnnouncements: () => mockExpireAnnouncements() },
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

const mockTryLock = jest.fn();
const mockUnlock = jest.fn();
jest.mock('advisory-lock', () => ({
  ...jest.requireActual('advisory-lock'),
  default: () => {
    return () => ({
      tryLock: () => mockTryLock(),
    });
  },
}));

describe('expire-announcements-scheduler', () => {
  it('should delegate the task to the service layer', async () => {
    mockTryLock.mockReturnValue(mockUnlock);
    expireAnnouncementsJob.start();
    await waitFor(async () => {
      expect(mockTryLock).toHaveBeenCalledTimes(1);
      expect(mockExpireAnnouncements).toHaveBeenCalled();
      expect(mockUnlock).toHaveBeenCalledTimes(1);
    }, 10000);
  });
});
