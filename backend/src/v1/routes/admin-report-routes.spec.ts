import bodyParser from 'body-parser';
import express, { Application } from 'express';
import request from 'supertest';
import { PayTransparencyUserError } from '../services/file-upload-service';
import { UserInputError } from '../types/errors';
import router from './admin-report-routes';

jest.mock('../services/utils-service', () => ({
  utils: {
    ...jest.requireActual('../services/utils-service').utils,
    getSessionUser: () => ({
      idir_username: 'SOME_USR',
      _json: {
        idir_user_guid: 'test-guid-123',
        client_roles: ['PTRT-ADMIN'], // Add the required role for authorization
      },
    }),
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
  admin_user_id: null,
  admin_modified_date: '2024-06-20T00:49:23.802Z',
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
const mockUpdateReportReportingYear = jest.fn();
const mockWithdrawReport = jest.fn();
const mockGetReportAdminActionHistory = jest.fn();
jest.mock('../services/admin-report-service', () => ({
  adminReportService: {
    ...jest.requireActual('../services/admin-report-service')
      .adminReportService,
    searchReport: (...args) => mockSearchReport(...args),
    changeReportLockStatus: (...args) => mockChangeReportLockStatus(...args),
    updateReportReportingYear: (...args) =>
      mockUpdateReportReportingYear(...args),
    withdrawReport: (...args) => mockWithdrawReport(...args),
    getReportPdf: (...args) => mockGetReportPdf(...args),
    getReportAdminActionHistory: (...args) =>
      mockGetReportAdminActionHistory(...args),
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
    describe('400 - Bad Request', () => {
      it('should return 400 when no valid properties are provided', () => {
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ invalid: false })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBe(
              'One of "is_unlocked", "is_withdrawn", or "reporting_year" must be provided',
            );
          });
      });

      it('should return 400 when more than one properties are provided', () => {
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_unlocked: true, reporting_year: 2025 })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBe(
              'Only one of "is_unlocked", "is_withdrawn", or "reporting_year" can be specified per call',
            );
          });
      });

      it('should return 400 when is_withdrawn is false', () => {
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_withdrawn: false })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBe('Invalid literal value, expected true');
          });
      });

      it('should return 400 when withdraw report fails with UserInputError', () => {
        mockWithdrawReport.mockRejectedValue(
          new UserInputError('Admin user not found'),
        );
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_withdrawn: true })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBe('Admin user not found');
          });
      });

      it('should return 400 when reporting year too old', () => {
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ reporting_year: 2020 })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBe(
              'reporting_year must be either the current year or previous year',
            );
          });
      });

      it('should return 500 when withdraw report fails with specific error message', () => {
        mockWithdrawReport.mockRejectedValue(
          new Error('Only published reports can be withdrawn'),
        );
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_withdrawn: true })
          .expect(500)
          .expect(({ body }) => {
            expect(body.error).toBe('Something went wrong');
          });
      });

      it('should return 500 when change lock status fails', () => {
        mockChangeReportLockStatus.mockRejectedValue({
          error: 'Error happened',
        });
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_unlocked: false })
          .expect(500)
          .expect(({ body }) => {
            expect(body.error).toBe('Something went wrong');
          });
      });

      it('should return 500 when update reporting year fails', () => {
        mockUpdateReportReportingYear.mockRejectedValue({
          error: 'Error happened',
        });
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ reporting_year: 2025 })
          .expect(500)
          .expect(({ body }) => {
            expect(body.error).toBe('Something went wrong');
          });
      });
    });

    describe('404 - Not Found', () => {
      it('should return 404 when report is not found (withdrawal)', () => {
        mockWithdrawReport.mockRejectedValue({ code: 'P2025' });
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_withdrawn: true })
          .expect(404)
          .expect(({ body }) => {
            expect(body.error).toBe('Report not found');
          });
      });

      it('should return 404 when report is not found (lock status)', () => {
        mockChangeReportLockStatus.mockRejectedValue({ code: 'P2025' });
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_unlocked: false })
          .expect(404)
          .expect(({ body }) => {
            expect(body.error).toBe('Report not found');
          });
      });

      it('should return 404 when report is not found (reporting year)', () => {
        mockUpdateReportReportingYear.mockRejectedValue({ code: 'P2025' });
        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ reporting_year: 2025 })
          .expect(404)
          .expect(({ body }) => {
            expect(body.error).toBe('Report not found');
          });
      });
    });

    describe('200 - Success', () => {
      it('should successfully withdraw a report', () => {
        const withdrawnReport = {
          ...mockReport,
          report_status: 'Withdrawn',
          admin_modified_date: new Date().toISOString(),
        };
        mockWithdrawReport.mockResolvedValue(withdrawnReport);

        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_withdrawn: true })
          .expect(200)
          .expect(({ body }) => {
            expect(body.report_status).toBe('Withdrawn');
            expect(mockWithdrawReport).toHaveBeenCalledWith(
              '4492feff-99d7-4b2b-8896-12a59a75d4e3',
              'test-guid-123',
            );
          });
      });

      it('should successfully change report lock status to unlocked', () => {
        mockChangeReportLockStatus.mockResolvedValue({
          report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
          is_unlocked: true,
        });

        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_unlocked: true })
          .expect(200)
          .expect(({ body }) => {
            expect(body).toEqual({
              report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
              is_unlocked: true,
            });
            expect(mockChangeReportLockStatus).toHaveBeenCalledWith(
              '4492feff-99d7-4b2b-8896-12a59a75d4e3',
              'test-guid-123',
              true,
            );
          });
      });

      it('should successfully change report lock status to locked', () => {
        mockChangeReportLockStatus.mockResolvedValue({
          report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
          is_unlocked: false,
        });

        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ is_unlocked: false })
          .expect(200)
          .expect(({ body }) => {
            expect(body).toEqual({
              report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
              is_unlocked: false,
            });
            expect(mockChangeReportLockStatus).toHaveBeenCalledWith(
              '4492feff-99d7-4b2b-8896-12a59a75d4e3',
              'test-guid-123',
              false,
            );
          });
      });

      it('should successfully update report reporting year', () => {
        const year = new Date().getFullYear();
        mockUpdateReportReportingYear.mockResolvedValue({
          report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
          reporting_year: year,
        });

        return request(app)
          .patch('/4492feff-99d7-4b2b-8896-12a59a75d4e3')
          .send({ reporting_year: year })
          .expect(200)
          .expect(({ body }) => {
            expect(body).toEqual({
              report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
              reporting_year: year,
            });
            expect(mockUpdateReportReportingYear).toHaveBeenCalledWith(
              '4492feff-99d7-4b2b-8896-12a59a75d4e3',
              'test-guid-123',
              year,
            );
          });
      });
    });
  });

  describe('GET /:id/admin-action-history', () => {
    describe('if reportId is invalid', () => {
      it('should return 404', async () => {
        const mockReportId = 'invalid';
        mockGetReportAdminActionHistory.mockRejectedValue(new UserInputError());
        await request(app)
          .get(`/${mockReportId}/admin-action-history`)
          .expect(404);
      });
    });
    describe('if reportId is valid', () => {
      it('should return 200', async () => {
        const mockReportId = 'invalid';
        const mockResults = [{}];
        mockGetReportAdminActionHistory.mockResolvedValue(mockResults);
        await request(app)
          .get(`/${mockReportId}/admin-action-history`)
          .expect(200)
          .expect(({ body }) => {
            expect(body).toEqual(mockResults);
          });
      });
    });
  });
});
