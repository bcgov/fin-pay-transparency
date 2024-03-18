import express, { Application } from 'express';
import request from 'supertest';
import router from './pay-transparency-routes';

const mockGetPayTransparencyData = jest.fn();
jest.mock('../services/pay-transparency-service', () => ({
  payTransparencyService: {
    getPayTransparencyData: (...args) => mockGetPayTransparencyData(...args),
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
    it('should return data if user doeas not send query params', () => {
      mockGetPayTransparencyData.mockReturnValue({
        status: 200,
        data: [{ id: 1 }],
      });
      return request(app)
        .get('')
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
        .query({page: 'one', pageSize: '1oooo'})
        .expect(400);
    });
    it('should fail if request fails to get reports', () => {
      mockGetPayTransparencyData.mockRejectedValue({})
      return request(app)
        .get('')
        .expect(500);
    });
  });
});
