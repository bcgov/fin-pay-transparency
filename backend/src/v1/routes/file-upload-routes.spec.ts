import express, { Application } from 'express';
import request from 'supertest';
import { fileUploadRouter } from './file-upload-routes';
import { SubmissionError } from '../services/file-upload-service';
let app: Application;

// Mock the module, but only override handleSubmission
const mockHandleSubmission = jest.fn().mockResolvedValue({});
jest.mock('../services/file-upload-service', () => {
  const actualFileUploadService = jest.requireActual(
    '../services/file-upload-service',
  );
  return {
    ...actualFileUploadService,
    fileUploadService: {
      ...actualFileUploadService.fileUploadService,
      handleSubmission: jest.fn((...args) => mockHandleSubmission(...args)),
    },
  };
});

const mockStoreError = jest.fn();
jest.mock('../services/error-service', () => ({
  errorService: {
    storeError: () => mockStoreError(),
    retrieveErrors: jest.fn(),
  },
}));

describe('file-upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(fileUploadRouter);
  });

  describe('/', () => {
    it('/ [POST] - should return 200', async () => {
      await request(app).post('/').expect(200);
      expect(mockStoreError).not.toHaveBeenCalled();
    });
    it('/ [POST] - should return 400', async () => {
      mockHandleSubmission.mockResolvedValue(new SubmissionError('test'));
      await request(app).post('/').expect(400);
      expect(mockStoreError).toHaveBeenCalled();
    });
    it('/ [POST] - should return 500', async () => {
      mockHandleSubmission.mockImplementation(() => {
        throw Error('test');
      });
      await request(app).post('/').expect(500);
      expect(mockStoreError).toHaveBeenCalled();
    });
  });
});
