import express, { Application } from 'express';
import request from 'supertest';
import router from './report-metrics-routes';

let app: Application;
const getReportsMetricsMock = jest.fn();
jest.mock('../../services/dashboard-metrics-service', () => ({
  getReportsMetrics: (...args) => getReportsMetricsMock(...args),
}));
describe('reports-metrics-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('/dashboard', router);
  });

  describe('GET /reports-metrics', () => {
    describe('200', () => {
      it('should return the announcement metrics', async () => {
        // Arrange
        getReportsMetricsMock.mockResolvedValueOnce({});

        // Act
        const response = await request(app).get('/dashboard/reports-metrics');

        // Assert
        expect(getReportsMetricsMock).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(200);
      });
    });
    describe('400', () => {
      it('should return 400 if an error occurs', async () => {
        // Arrange
        getReportsMetricsMock.mockRejectedValueOnce(
          new Error('An error occurred'),
        );

        // Act
        const response = await request(app).get('/dashboard/reports-metrics');

        // Assert
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'An error occurred while fetching the reports metrics',
        });
      });
    });
  });
});
