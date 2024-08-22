import waitFor from 'wait-for-expect';
import expireAnnouncementsJob from './expire-announcements-scheduler';
import { logger as log } from '../logger';

jest.mock('../v1/services/utils-service', () => ({
  utils: {
    delay: jest.fn(),
  },
}));

const mock_expireAnnouncements = jest.fn();
jest.mock('../v1/services/scheduler-service', () => ({
  schedulerService: { expireAnnouncements: () => mock_expireAnnouncements() },
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

describe('expire-announcements-scheduler', () => {
  it('should expire invalid announcements', async () => {
    mock_tryLock.mockReturnValue(mock_unlock);
    expireAnnouncementsJob.start();
    await waitFor(async () => {
      log.info('where is this printed?');
      expect(mock_tryLock).toHaveBeenCalledTimes(1);
      expect(mock_expireAnnouncements).toHaveBeenCalled();
      expect(mock_unlock).toHaveBeenCalledTimes(1);
    }, 10000);
  });
});
