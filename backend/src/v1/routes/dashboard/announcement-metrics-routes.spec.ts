import express, { Application } from 'express';
import request from 'supertest';
import router from './announcement-metrics-routes.js';

let app: Application;
const getAnnouncementMetricsMock = jest.fn();
jest.mock('../../services/announcements-service', () => ({
  announcementService: {
    getAnnouncementMetrics: (...args) => getAnnouncementMetricsMock(...args),
  },
}));
describe('announcement-metrics-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('/dashboard', router);
  });

  describe('GET /announcement-metrics', () => {
    describe('200', () => {
      it('should return the announcement metrics', async () => {
        // Arrange
        getAnnouncementMetricsMock.mockResolvedValueOnce({});

        // Act
        const response = await request(app).get(
          '/dashboard/announcement-metrics',
        );

        // Assert
        expect(getAnnouncementMetricsMock).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(200);
      });
    });
    describe('400', () => {
      it('should return 400 if an error occurs', async () => {
        // Arrange
        getAnnouncementMetricsMock.mockRejectedValueOnce(
          new Error('An error occurred'),
        );

        // Act
        const response = await request(app).get(
          '/dashboard/announcement-metrics',
        );

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'An error occurred while fetching the announcements metrics',
        });
      });
    });
  });
});
