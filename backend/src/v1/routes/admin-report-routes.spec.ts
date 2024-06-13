import express, { Application } from 'express';
import router from './admin-report-routes';
import request from 'supertest';
import bodyParser from 'body-parser';

jest.mock('../services/utils-service', () => ({
  utils: {
    ...jest.requireActual('../services/utils-service').utils,
    getSessionUser: () => ({ idir_username: 'SOME_USR'}),
  },
}));

const mockSearchReport = jest.fn();
const mockChangeReportLockStatus = jest.fn();
jest.mock('../services/admin-report-service', () => ({
  adminReportService: {
    searchReport: (...args) => mockSearchReport(...args),
    changeReportLockStatus: (...args) => mockChangeReportLockStatus(...args),
  },
}));

let app: Application;
describe('admin-report-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(bodyParser.json())
    app.use(router);
  });

  describe('GET /', () => {
    it('should default offset=0 and limit=20', async () => {
      await request(app).get('').expect(200);
      expect(mockSearchReport).toHaveBeenCalledWith(
        0,
        20,
        undefined,
        undefined,
      );
    });

    it('should resolve query params', async () => {
      await request(app)
        .get('')
        .query({
          offset: 1,
          limit: 50,
          filter: 'naics_code=11',
          sort: 'field=naics_code,direction=asc',
        })
        .expect(200);
      expect(mockSearchReport).toHaveBeenCalledWith(
        1,
        50,
        'field=naics_code,direction=asc',
        'naics_code=11',
      );
    });
    it('400 - if search reports fails', async () => {
      mockSearchReport.mockRejectedValue({ error: true });
      await request(app)
        .get('')
        .query({
          offset: 1,
          limit: 50,
          filter: 'naics_code=11',
          sort: 'field=naics_code,direction=asc',
        })
        .expect(400);
    });
  });

  describe('PATCH /:id', () => {
    describe('400', () => { 
      it('invalid body', () => {
        return request(app).patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
        .send({invalid: false})
        .expect(400)
        .expect(({body}) => {
          expect(body.error).toBe('Missing field "is_unlocked" in the data');
        });
      });
      it('fail to change report lock status', () => {
        mockChangeReportLockStatus.mockRejectedValue({ error: 'Error happened' });
        return request(app).patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
        .send({is_unlocked: false})
        .expect(400)
        .expect(({body}) => {
          expect(body.error).toBe('Error happened');
        });
      });
     });
    it('404 - report is not found', () => {
      mockChangeReportLockStatus.mockRejectedValue({ code: 'P2025' });
      return request(app).patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
      .send({is_unlocked: false})
      .expect(404)
      .expect(({body}) => {
        expect(body.error).toBe('Report not found')
      });
    });
    it('200 - report lock status changed', () => {
      mockChangeReportLockStatus.mockResolvedValue({
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
      });
      return request(app).patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
      .send({is_unlocked: false})
      .expect(200)
      .expect(({body}) => {
        expect(body).toEqual({
          report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
        });
      });
    });
  });
});
