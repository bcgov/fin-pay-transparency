import express, { Application } from 'express';
import router from './code-routes';
import request from 'supertest';
let app: Application;

const mockGetAllEmployeeCountRanges = jest.fn();
const mockGetAllNaicsCodes = jest.fn();
jest.mock('../services/code-service', () => ({
  codeService: {
    getAllEmployeeCountRanges: (...args) =>
      mockGetAllEmployeeCountRanges(...args),
    getAllNaicsCodes: () => mockGetAllNaicsCodes(),
  },
}));
describe('code-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(router);
  });

  describe('/employee-count-ranges [GET]', () => {
    it('should return 200', () => {
        return request(app).get('/employee-count-ranges')
        .expect(200);
    });
  });
  describe('/naics-codes [GET]', () => {
    it('should return 200', () => {
        mockGetAllNaicsCodes.mockReturnValue([])
        return request(app).get('/naics-codes')
        .expect(200);
    });
  });
  
});
