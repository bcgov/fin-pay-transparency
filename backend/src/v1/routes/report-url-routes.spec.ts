import { vi, describe, it, expect, beforeEach } from 'vitest';
import bodyParser from 'body-parser';
import express, { Application } from 'express';
import request from 'supertest';
import router from './report-url-routes.js';

const mockGetSessionUser = vi.fn();
const mockCreateOrUpdateReportUrlSafe = vi.fn();
const mockGetHistoryForReport = vi.fn();
let mockShouldAuthorize = true;

vi.mock(import('../services/utils-service.js'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    utils: {
      ...actual.utils,
      getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
    },
  };
});

vi.mock(import('../services/report-url-service.js'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createOrUpdateReportUrlSafe: (...args: unknown[]) =>
      mockCreateOrUpdateReportUrlSafe(...args),
    getHistoryForReport: (...args: unknown[]) =>
      mockGetHistoryForReport(...args),
  };
});

vi.mock('../middlewares/authorization/authorize', () => ({
  authorize: (...args: unknown[]) => {
    return (req, res, next) => {
      if (mockShouldAuthorize) {
        return next();
      }
      return res.status(401).json({ message: 'Unauthorized' });
    };
  },
}));

describe('report-url-routes', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use('', router);
    app.use((error, req, res, next) => {
      res.status(400).json({ message: error.message, error });
    });

    mockShouldAuthorize = true;
    vi.clearAllMocks();
  });

  describe('GET /:reportId/history', () => {
    it('should return report url history when authorized', async () => {
      const reportId = '11111111-1111-1111-1111-111111111111';
      const history = [
        { report_id: reportId, report_url: 'https://example.com' },
      ];
      mockGetHistoryForReport.mockResolvedValueOnce(history);

      const response = await request(app)
        .get(`/${reportId}/history`)
        .expect(200);

      expect(response.body).toEqual(history);
      expect(mockGetHistoryForReport).toHaveBeenCalledWith(reportId);
    });

    it('should return 401 when authorization fails', async () => {
      mockShouldAuthorize = false;
      const reportId = '22222222-2222-2222-2222-222222222222';

      await request(app).get(`/${reportId}/history`).expect(401);
    });

    it('should return 400 when not able to retrieve history', async () => {
      const reportId = '22222222-2222-2222-2222-222222222222';
      mockGetHistoryForReport.mockRejectedValueOnce(
        new Error('Report not found or user not authorized to view it'),
      );

      await request(app).get(`/${reportId}/history`).expect(400);
    });
  });

  describe('POST /:reportId', () => {
    it('should create or update a report url when payload is valid', async () => {
      const reportId = '33333333-3333-3333-3333-333333333333';
      const reportUrl = 'https://example.com/report';
      const record = {
        url_id: 'abc123',
        report_id: reportId,
        report_url: reportUrl,
      };

      mockGetSessionUser.mockReturnValue({
        _json: {
          bceid_business_guid: 'business-guid',
          bceid_user_guid: 'user-guid',
        },
      });
      mockCreateOrUpdateReportUrlSafe.mockResolvedValueOnce(record);

      const response = await request(app)
        .post(`/${reportId}`)
        .send({ reportUrl })
        .expect(201);

      expect(response.body).toEqual(record);
      expect(mockCreateOrUpdateReportUrlSafe).toHaveBeenCalledWith(
        reportId,
        reportUrl,
        'business-guid',
        'user-guid',
      );
    });

    it('should return 400 when reportUrl is invalid', async () => {
      const reportId = '44444444-4444-4444-4444-444444444444';

      await request(app)
        .post(`/${reportId}`)
        .send({ reportUrl: 'http://invalid-url' })
        .expect(400);
    });

    it('should return 400 when the service throws', async () => {
      const reportId = '55555555-5555-5555-5555-555555555555';
      const reportUrl = 'https://example.com/report';

      mockGetSessionUser.mockReturnValueOnce({
        _json: {
          bceid_business_guid: 'business-guid',
          bceid_user_guid: 'user-guid',
        },
      });
      mockCreateOrUpdateReportUrlSafe.mockRejectedValueOnce(
        new Error('Report not found or user not authorized to update it'),
      );

      await request(app).post(`/${reportId}`).send({ reportUrl }).expect(400);
    });
  });
});
