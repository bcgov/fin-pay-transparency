import express, { Application } from 'express';
import router from './analytic-routes';
import request from 'supertest';
let app: Application;

const mockGetEmbedInfo = jest.fn();
jest.mock('../services/analytic-service', () => {
  const actual = jest.requireActual('../services/analytic-service');
  return {
    ...actual,
    getEmbedInfo: (...args) => mockGetEmbedInfo(...args),
  };
});

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(router);
  });

  describe('/embed/:resourceName [GET]', () => {
    mockGetEmbedInfo.mockReturnValue({});

    it('should return 200', async () => {
      await request(app)
        .get('/embed?resources[]=SubmissionAnalytics')
        .expect(200);
      expect(mockGetEmbedInfo).toHaveBeenCalledWith(['SubmissionAnalytics']);
    });

    it('should allow multiple resource names', async () => {
      await request(app)
        .get('/embed?resources[]=SubmissionAnalytics&resources[]=DataAnalytics')
        .expect(200);
      expect(mockGetEmbedInfo).toHaveBeenCalledWith([
        'SubmissionAnalytics',
        'DataAnalytics',
      ]);
    });

    it('should return 500 if invalid resource name provided', async () => {
      await request(app).get('/embed?resources[]=testResource').expect(500);
    });

    it('should return 500 if not an array', async () => {
      await request(app).get('/embed?resources=DataAnalytics').expect(500);
    });
  });
});
