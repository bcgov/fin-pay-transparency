import express, { Application } from 'express';
import request from 'supertest';
import resourcesRouter from './resources-routes';

const mockDownloadFile = jest.fn();
jest.mock('../../external/services/s3-api', () => ({
  downloadFile: (...args) => mockDownloadFile(...args),
}));

describe('resources-routes', () => {
  let app: Application;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/resources', resourcesRouter);
  });

  describe('GET /resources/:fileId', () => {
    it('should return 200', async () => {
        mockDownloadFile.mockImplementation((res, fileId) => {
            expect(fileId).toBe('fileId');
            res.status(200).json({});
        });
      const fileId = 'fileId';
      const res = await request(app).get(`/resources/${fileId}`);
      expect(res.status).toBe(200);
    });
  });
});
