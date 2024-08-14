import express, { Application } from 'express';
import router from './analytic-routes';
import request from 'supertest';
let app: Application;

const mockGetEmbedInfo = jest.fn();
jest.mock('../services/analytic-service', () => ({
  getEmbedInfo: (...args) => mockGetEmbedInfo(...args),
}));
describe('embed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(router);
  });

  describe('/embed/:resourceName [GET]', () => {
    it('should return 200', async () => {
      mockGetEmbedInfo.mockReturnValue({});
      await request(app).get('/embed/testResource').expect(200);
      expect(mockGetEmbedInfo).toHaveBeenCalledWith('testResource');
    });
  });
});
