import bodyParser from 'body-parser';
import express, { Application } from 'express';
import request from 'supertest';
import { SubmissionError } from '../services/file-upload-service';
import { fileUploadRouter } from './file-upload-routes';
let app: Application;

const maliciousObject = { $ne: '1' };
const validSubmissionBody = {
  companyName: 'ABC Company',
  companyAddress: '123 Main St',
  naicsCode: '11',
  employeeCountRangeId: '123434565467678',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  reportingYear: 2024,
  dataConstraints: '<p>Data constraints here</p>',
  comments: null,
  rows: [],
};

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
    app.use(bodyParser.json());
    app.use(fileUploadRouter);
  });

  describe('POST /', () => {
    describe('when the request body is valid', () => {
      it('should return 200', async () => {
        await request(app).post('/').send(validSubmissionBody).expect(200);
        expect(mockStoreError).not.toHaveBeenCalled();
      });
    });
    describe('when the request body is empty', () => {
      it('should return 400', async () => {
        mockHandleSubmission.mockResolvedValue(new SubmissionError('test'));
        await request(app).post('/').expect(400);
        expect(mockStoreError).toHaveBeenCalled();
      });
    });
    [
      'companyName',
      'companyAddress',
      'naicsCode',
      'employeeCountRangeId',
      'startDate',
      'endDate',
      'reportingYear',
      'dataConstraints',
      'comments',
      'rows',
    ].forEach((fieldName) => {
      describe(`when ${fieldName} is invalid`, () => {
        it('should return 400', async () => {
          const invalidSubmissionBody = {
            ...validSubmissionBody,
          };
          invalidSubmissionBody[fieldName] = maliciousObject;
          await request(app).post('/').send(invalidSubmissionBody).expect(400);
          expect(mockStoreError).toHaveBeenCalled();
        });
      });
    });
  });
});
