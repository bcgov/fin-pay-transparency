import express, { Application } from 'express';
import request from 'supertest';
import { fileUploadRouter } from './file-upload-routes';
let app: Application;

const mockHandleSubmission = jest.fn().mockResolvedValue({});
const mockGetCompanies = jest.fn();
jest.mock('../services/file-upload-service', () => ({
  fileUploadService: {
    handleSubmission: jest.fn((...args) => mockHandleSubmission(...args)),
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
      return request(app).post('/');
    });
  });
});
