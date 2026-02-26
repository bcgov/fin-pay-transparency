import { vi, describe, it, expect, beforeEach } from 'vitest';
import bodyParser from 'body-parser';
import express, { Application } from 'express';
import request from 'supertest';
import { SubmissionError } from '../services/file-upload-service.js';
import { fileUploadRouter } from './file-upload-routes.js';
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
const mockHandleSubmission = vi.fn().mockResolvedValue({});
vi.mock(
  import('../services/file-upload-service.js'),
  async (importOriginal) => {
    const actualFileUploadService = await importOriginal();
    return {
      ...actualFileUploadService,
      fileUploadService: {
        ...actualFileUploadService.fileUploadService,
        handleSubmission: vi.fn((...args) => mockHandleSubmission(...args)),
      },
    };
  },
);

const mockStoreError = vi.fn();
vi.mock('../services/error-service', () => ({
  errorService: {
    storeError: () => mockStoreError(),
    retrieveErrors: vi.fn(),
  },
}));

describe('file-upload', () => {
  beforeEach(() => {
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
