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

jest.mock('./create-job', () => ({
  createJob: jest.fn((cronTime, callback, mutex, { title, message }) => {
    return {
      start: jest.fn(async () => {
        console.log(`Mock run`);
        try {
          await callback(); // Simulate the callback execution
        } catch (e) {
          console.error(`Mock error`);
        } finally {
          console.log(`Mock end run`);
        }
      }),
    };
  }),
}));
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
