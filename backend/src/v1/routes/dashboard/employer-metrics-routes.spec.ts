import express, { Application } from 'express';
import request from 'supertest';
import router from './employer-metrics-routes';

let app: Application;
const getEmployerMetricsMock = jest.fn();
jest.mock('../../services/employer-service', () => ({
  employerService: {
    getEmployerMetrics: (...args) => getEmployerMetricsMock(...args),
  },
}));
describe('employer-metrics-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('/dashboard', router);
  });

  describe('GET /employer-metrics', () => {
    describe('200', () => {
      it('should return the announcement metrics', async () => {
        // Arrange
        getEmployerMetricsMock.mockResolvedValueOnce({});

        // Act
        const response = await request(app).get('/dashboard/employer-metrics');

        // Assert
        expect(getEmployerMetricsMock).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(200);
      });
    });
    describe('500', () => {
      it('should return 500 if an error occurs', async () => {
        // Arrange
        getEmployerMetricsMock.mockRejectedValueOnce(
          new Error('An error occurred'),
        );

        // Act
        const response = await request(app).get('/dashboard/employer-metrics');

        // Assert
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          error: 'An error occurred while fetching the employer metrics',
        });
      });
    });
  });
});
