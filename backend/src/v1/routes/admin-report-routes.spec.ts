import bodyParser from 'body-parser';
import express, { Application } from 'express';
import request from 'supertest';
import { PayTransparencyUserError } from '../services/file-upload-service';
import router from './admin-report-routes';

jest.mock('../services/utils-service', () => ({
  utils: {
    ...jest.requireActual('../services/utils-service').utils,
    getSessionUser: () => ({ idir_username: 'SOME_USR' }),
  },
}));

const mockReport = {
  report_id: '1119e398-22e7-4d10-93aa-8b2112b4e74f',
  company_id: '515c7526-7d56-4509-a713-cad45fb10a3d',
  user_id: 'a5ee6f48-13e1-40f3-a0e3-266d842aa7b0',
  user_comment: 'comment',
  employee_count_range_id: 'f65072ec-6b13-4ceb-b7bb-2397b4838d45',
  naics_code: '52',
  report_start_date: '2023-01-01T00:00:00.000Z',
  report_end_date: '2023-12-31T00:00:00.000Z',
  create_date: '2024-06-17T22:08:07.405Z',
  update_date: '2024-06-17T22:08:07.405Z',
  create_user: 'postgres',
  update_user: 'postgres',
  report_status: 'Published',
  revision: '1',
  data_constraints: '234',
  is_unlocked: false,
  reporting_year: '2023',
  report_unlock_date: '2024-06-20T00:49:23.802Z',
  idir_modified_username: null,
  idir_modified_date: '2024-06-20T00:49:23.802Z',
  employee_count_range: {
    employee_count_range_id: 'f65072ec-6b13-4ceb-b7bb-2397b4838d45',
    employee_count_range: '300-999',
    create_date: '2024-06-17T22:00:10.084Z',
    update_date: '2024-06-17T22:00:10.084Z',
    effective_date: '2024-06-17T22:00:10.084Z',
    expiry_date: null,
    create_user: 'postgres',
    update_user: 'postgres',
  },
  pay_transparency_company: {
    company_id: '515c7526-7d56-4509-a713-cad45fb10a3d',
    company_name: 'BC Crown Corp',
  },
};

const mockSearchReport = jest.fn().mockResolvedValue({ reports: [mockReport] });
const mockChangeReportLockStatus = jest.fn();
jest.mock('../services/admin-report-service', () => ({
  adminReportService: {
    ...jest.requireActual('../services/admin-report-service')
      .adminReportService,
    searchReport: (...args) => mockSearchReport(...args),
    changeReportLockStatus: (...args) => mockChangeReportLockStatus(...args),
    getReportPdf: (...args) => mockGetReportPdf(...args),
  },
}));
const mockGetReportPdf = jest
  .fn()
  .mockResolvedValue(Buffer.from('mock pdf', 'utf8'));
const mockGetReportFileName = jest.fn().mockResolvedValue('report.pdf');
jest.mock('../services/report-service', () => ({
  reportService: {
    getReportPdf: (...args) => mockGetReportPdf(...args),
    getReportFileName: (...args) => mockGetReportFileName(...args),
  },
}));

let app: Application;
describe('admin-report-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(bodyParser.json());
    app.use(router);
  });

  describe('GET /', () => {
    describe('when output format is JSON', () => {
      describe("when limit isn't specified", () => {
        it('should default offset=0 and limit=20', async () => {
          await request(app)
            .get('')
            .set('Accept', 'application/json')
            .expect(200);
          expect(mockSearchReport).toHaveBeenCalledWith(
            0,
            20,
            undefined,
            undefined,
          );
        });
      });
      describe('when offset, limit, filter and sort are specified', () => {
        it('should resolve query params', async () => {
          await request(app)
            .get('')
            .set('Accept', 'application/json')
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
      });
      describe('when an error is thrown', () => {
        it('400 - if search reports fails', async () => {
          mockSearchReport.mockRejectedValueOnce(
            new PayTransparencyUserError('invalid params'),
          );
          await request(app)
            .get('')
            .set('Accept', 'application/json')
            .query({
              offset: 1,
              limit: 50,
              filter: 'naics_code=11',
              sort: 'field=naics_code,direction=asc',
            })
            .expect(400);
        });
      });
    });
    describe('when output format is CSV', () => {
      it('should default offset=0 and limit=undefined', async () => {
        await request(app).get('').set('Accept', 'text/csv').expect(200);
        expect(mockSearchReport).toHaveBeenCalledWith(
          0,
          undefined,
          undefined,
          undefined,
        );
      });
    });
  });

  describe('GET /:id', () => {
    describe('if reportId is valid', () => {
      it('should fetch a pdf report', async () => {
        const mockReportId = '4492feff-99d7-4b2b-8896-12a59a75d4e3';
        await request(app)
          .get(`/${mockReportId}`)
          .set('Accept', 'application/pdf')
          .expect(200);
        expect(mockGetReportPdf.mock.calls[0][1]).toBe(mockReportId);
      });
    });
    describe('if reportId is invalid', () => {
      it('return an error', async () => {
        const mockReportId = '4492feff-99d7-4b2b-8896-12a59a75d4e3';
        mockGetReportPdf.mockResolvedValueOnce(null);
        await request(app)
          .get(`/${mockReportId}`)
          .set('Accept', 'application/pdf')
          .expect(404);
        expect(mockGetReportPdf.mock.calls[0][1]).toBe(mockReportId);
      });
    });
    describe('if accept header is invalid', () => {
      it('return an error', async () => {
        const mockReportId = '4492feff-99d7-4b2b-8896-12a59a75d4e3';
        mockGetReportPdf.mockResolvedValueOnce(null);
        await request(app)
          .get(`/${mockReportId}`)
          .set('Accept', 'application/json')
          .expect(400);
      });
    });
  });

  describe('PATCH /:id', () => {
    describe('400', () => {
      it('invalid body', () => {
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ invalid: false })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBe('Missing field "is_unlocked" in the data');
          });
      });
      it('fail to change report lock status', () => {
        mockChangeReportLockStatus.mockRejectedValue({
          error: 'Error happened',
        });
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_unlocked: false })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBe('Error happened');
          });
      });
    });
    it('404 - report is not found', () => {
      mockChangeReportLockStatus.mockRejectedValue({ code: 'P2025' });
      return request(app)
        .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
        .send({ is_unlocked: false })
        .expect(404)
        .expect(({ body }) => {
          expect(body.error).toBe('Report not found');
        });
    });
    it('200 - report lock status changed', () => {
      mockChangeReportLockStatus.mockResolvedValue({
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
      });
      return request(app)
        .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
        .send({ is_unlocked: false })
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({
            report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
          });
        });
    });
  });
});
