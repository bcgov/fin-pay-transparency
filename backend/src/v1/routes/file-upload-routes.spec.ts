import express, { Application } from 'express';
import { fileUploadRouter } from './file-upload-routes';
import request from 'supertest';
let app: Application;

const mockHandleFileUpload = jest.fn();
const mockGetCompanies = jest.fn();
jest.mock('../services/file-upload-service', () => ({
  fileUploadService: {
    handleFileUpload: jest.fn((...args) => mockHandleFileUpload(...args)),
    getCompanies: () => mockGetCompanies(),
  },
}));
describe('file-upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(fileUploadRouter);
  });

  describe('/', () => {
    it('/ [POST] - should return 200', () => {
      mockHandleFileUpload.mockImplementation((_req, res) => {
        return res.status(200).json({});
      })
      return request(app).post('/').expect(200);
    });
    it('/ [GET] - should return 200', () => {
      return request(app).get('/').expect(200);
    });
  });
});
