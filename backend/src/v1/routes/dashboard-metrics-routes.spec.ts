import express, { Application } from 'express';
import request from 'supertest';
import router from './dashboard-metrics-routes';

let app: Application;
const getDashboardMetricsMock = jest.fn();
jest.mock('../services/dashboard-metrics-service', () => ({
  getDashboardMetrics: (...args) => getDashboardMetricsMock(...args),
}));
describe('dashboard-metrics-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('/dashboard', router);
  });
  describe('200', () => {
    describe('GET /metrics', () => {
      it('should return the dashboard metrics', async () => {
        // Arrange
        const currentYear = new Date().getFullYear();
        getDashboardMetricsMock.mockResolvedValueOnce({});

        // Act
        const response = await request(app).get('/dashboard/metrics');

        // Assert
        expect(getDashboardMetricsMock).toHaveBeenCalledTimes(1);
        expect(getDashboardMetricsMock).toHaveBeenCalledWith({
          reportingYear: currentYear,
        });
        expect(response.status).toBe(200);
      });
    });
  });

  describe('400', () => {
    describe('GET /metrics', () => {
      it('should return 400 if an error occurs', async () => {
        // Arrange
        getDashboardMetricsMock.mockRejectedValueOnce(new Error('An error occurred'));

        // Act
        const response = await request(app).get('/dashboard/metrics');

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'An error occurred while fetching the dashboard metrics',
        });
      });
    });
  });
});
