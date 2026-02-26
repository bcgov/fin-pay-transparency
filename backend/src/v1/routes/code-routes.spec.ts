import { vi, describe, it, beforeEach } from 'vitest';
import express, { Application } from 'express';
import router from './code-routes.js';
import request from 'supertest';
let app: Application;

const mockGetAllEmployeeCountRanges = vi.fn();
const mockGetAllNaicsCodes = vi.fn();
vi.mock('../services/code-service', () => ({
  codeService: {
    getAllEmployeeCountRanges: (...args) =>
      mockGetAllEmployeeCountRanges(...args),
    getAllNaicsCodes: () => mockGetAllNaicsCodes(),
  },
}));
describe('code-routes', () => {
  beforeEach(() => {
    app = express();
    app.use(router);
  });

  describe('/employee-count-ranges [GET]', () => {
    it('should return 200', () => {
      return request(app).get('/employee-count-ranges').expect(200);
    });
  });
  describe('/naics-codes [GET]', () => {
    it('should return 200', () => {
      mockGetAllNaicsCodes.mockReturnValue([]);
      return request(app).get('/naics-codes').expect(200);
    });
  });
});
