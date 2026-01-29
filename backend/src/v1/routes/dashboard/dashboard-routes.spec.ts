import express, { Application } from 'express';
import request from 'supertest';
import router from './dashboard-routes.js';

jest.mock('../../services/announcements-service', () => ({
  announcementService: { getAnnouncementMetrics: jest.fn() },
}));
jest.mock('../../services/admin-report-service', () => ({
  adminReportService: {
    getReportsMetrics: jest.fn(),
  },
}));
describe('Dashboard', () => {
  let app: Application;
  beforeEach(() => {
    app = express();
    app.use('/dashboard', router);
  });

  describe('GET /announcement-metrics', () => {
    describe('200', () => {
      it('should return the announcement metrics', async () => {
        // Act
        const response = await request(app).get(
          '/dashboard/announcement-metrics',
        );

        // Assert
        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /reports-metrics', () => {
    describe('200', () => {
      it('should return the reports metrics', async () => {
        // Act
        const response = await request(app).get('/dashboard/reports-metrics');

        // Assert
        expect(response.status).toBe(200);
      });
    });
  });
});
