import express, { Application } from 'express';
import request from 'supertest';
import router from './pay-transparency-routes';

const mockGetPayTransparencyData = jest.fn();
const mockDeleteReports = jest.fn();
const mockGetReportErrors = jest.fn();
jest.mock('../services/pay-transparency-service', () => ({
  payTransparencyService: {
    getPayTransparencyData: (...args) => mockGetPayTransparencyData(...args),
    deleteReports: (...args) => mockDeleteReports(...args),
    getReportErrors: (...args) => mockGetReportErrors(...args),
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
      return request(app).get('').set('x-api-key', 'api-key').expect(400);
    });

    describe('should default to max page size 50', () => {
      it('when specified page size if greater than 50', () => {
        mockGetPayTransparencyData.mockImplementation((...args) => {
          expect(args[3]).toBe(50);
          return {
            status: 200,
            data: [{ id: 1 }],
          };
        });

        return request(app).get('').set('x-api-key', 'api-key').expect(200);
      });
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
        .query({ companyName: '1234567890' })
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
        .set('x-api-key', 'api-delete-reports-key')
        .query({ companyName: '1234567890' })
        .expect(400);
    });

    it('should fail if request fails to get reports', () => {
      mockDeleteReports.mockRejectedValue({ message: 'Error happened' });
      return request(app)
        .delete('/')
        .query({ companyName: '1234567890' })
        .set('x-api-key', 'api-delete-reports-key')
        .expect(500);
    });

    it('should fail if company name is not supplied', () => {
      mockDeleteReports.mockRejectedValue({ message: 'Error happened' });
      return request(app)
        .delete('/')
        .set('x-api-key', 'api-delete-reports-key')
        .expect(404);
    });
  });

  describe('GET /errors', () => {
    it('should return data if user does not send query params', async () => {
      mockGetReportErrors.mockReturnValue({
        status: 200,
        data: [{ id: 1 }],
      });
      await request(app)
        .get('/errors')
        .set('x-api-key', 'api-error-reports-key')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toHaveLength(1);
        });
      expect(mockGetReportErrors).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });
    it('should forward all parameters to the function', async () => {
      mockGetReportErrors.mockReturnValue({
        status: 200,
        data: [{ id: 1 }],
      });
      await request(app)
        .get('/errors')
        .set('x-api-key', 'api-error-reports-key')
        .query({
          startDate: 'start',
          endDate: 'end',
          page: '1',
          pageSize: '50',
        })
        .expect(200)
        .expect(({ body }) => {
          expect(body).toHaveLength(1);
        });
      expect(mockGetReportErrors).toHaveBeenCalledWith(
        'start',
        'end',
        '1',
        '50',
      );
    });

    it('should return 400 if the function has an error', () => {
      mockGetReportErrors.mockReturnValue({
        data: { message: 'Failed to get data', error: true },
      });
      return request(app)
        .get('/errors')
        .set('x-api-key', 'api-error-reports-key')
        .expect(400);
    });

    it('should fail if request fails', () => {
      mockGetReportErrors.mockRejectedValue({ message: 'Error happened' });
      return request(app)
        .get('/errors')
        .set('x-api-key', 'api-error-reports-key')
        .expect(500);
    });
  });
});
