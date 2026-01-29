import express, { Application } from 'express';
import request from 'supertest';
import router from './user-info-routes.js';
let app: Application;

const mockGetUserInfo = jest.fn();
jest.mock('../services/public-auth-service', () => ({
  publicAuth: {
    handleGetUserInfo: jest.fn((...args) => mockGetUserInfo(...args)),
  },
}));
describe('user-info-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(router);
  });

  describe('/', () => {
    it('[GET] - should return 200', () => {
      mockGetUserInfo.mockImplementation((_req, res) => {
        return res.status(200).json({});
      });
      return request(app).get('/').expect(200);
    });
  });
});
