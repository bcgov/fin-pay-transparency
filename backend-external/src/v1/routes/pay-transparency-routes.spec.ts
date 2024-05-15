import express, { Application } from 'express';
import request from 'supertest';
import router from './pay-transparency-routes';

const mockGetPayTransparencyData = jest.fn();
const mockDeleteReports = jest.fn();
jest.mock('../services/pay-transparency-service', () => ({
  payTransparencyService: {
    getPayTransparencyData: (...args) => mockGetPayTransparencyData(...args),
    deleteReports: (...args) => mockDeleteReports(...args),
  },
}));

let app: Application;

describe('pay-transparency-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('', router);
  });

  describe('/ GET', () => {
    it('should return data if user does not send query params', () => {
      mockGetPayTransparencyData.mockReturnValue({
        status: 200,
        data: [{ id: 1 }],
      });
      return request(app)
        .get('')
        .set('x-api-key', 'api-key')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toHaveLength(1);
        });
    });
    it('should fail if page or pageSize are not numbers', () => {
      mockGetPayTransparencyData.mockReturnValue({
        status: 200,
        data: [{ id: 1 }],
      });
      return request(app)
        .get('')
        .set('x-api-key', 'api-key')
        .query({ page: 'one', pageSize: '1oooo' })
        .expect(400);
    });
    it('should fail if request fails to get reports', () => {
      mockGetPayTransparencyData.mockRejectedValue({});
      return request(app).get('').set('x-api-key', 'api-key').expect(500);
    });

    it('should return 400 if the getPayTransparencyData has error', () => {
      mockGetPayTransparencyData.mockReturnValue({
        data: { message: 'Failed to get reports', error: true },
      });
      return request(app)
        .get('')
        .set('x-api-key', 'api-key')
        .expect(400);
    });
  });

  describe('/reports, DELETE', () => {
    it('should delete reports', () => {
      const message = 'Report deleted';
      mockDeleteReports.mockReturnValue({
        status: 200,
        data: { message },
      });
      return request(app)
        .delete('/')
        .query({ companyId: '1234567890' })
        .set('x-api-key', 'api-delete-reports-key')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({ message });
        });
    });
    it('should return 400 if the deleteReports has error', () => {
      mockDeleteReports.mockReturnValue({
        data: { message: 'Failed to delete reports', error: true },
      });
      return request(app)
        .delete('/')
        .query({ companyId: '1234567890' })
        .set('x-api-key', 'api-delete-reports-key')
        .query({ companyId: '' })
        .expect(400);
    });
    it('should fail if request fails to get reports', () => {
      mockDeleteReports.mockRejectedValue({ message: 'Error happened' });
      return request(app)
        .delete('/')
        .query({ companyId: '1234567890' })
        .set('x-api-key', 'api-delete-reports-key')
        .expect(500);
    });
  });
});
