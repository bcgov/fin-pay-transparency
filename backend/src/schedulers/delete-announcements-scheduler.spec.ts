import waitFor from 'wait-for-expect';
import deleteAnnouncementsJob from './delete-announcements-scheduler';
import { announcementService } from '../v1/services/announcements-service';

jest.mock('../config', () => ({
  config: {
    get: (key: string) => {
      const settings = {
        'server:deleteAnnouncementsCronTime': '121212121',
      };

      return settings[key];
    },
  },
}));

jest.mock('./create-job');
jest.mock('../v1/services/announcements-service');

describe('delete-announcements-scheduler', () => {
  it('should run the function', async () => {
    deleteAnnouncementsJob.start();
    await waitFor(async () => {
      expect(
        announcementService.deleteAnnouncementsSchedule,
      ).toHaveBeenCalled();
    });
  });
});
