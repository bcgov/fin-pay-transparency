import express, { Application } from 'express';
import request from 'supertest';
import router from './external-consumer-routes';
import { faker } from '@faker-js/faker';

const mockCount = jest.fn();
const mockReportsViewFindMany = jest.fn();
jest.mock('../prisma/prisma-client-readonly-replica', () => {
  return {
    __esModule: true,
    default: {
      $replica: () => {
        return {
          reports_calculated_data_view: {
            count: (...args) => mockCount(...args),
            findMany: (...args) => mockReportsViewFindMany(...args),
          },
        };
      },
    },
  };
});

const mockDeleteReports = jest.fn();
jest.mock('../services/external-consumer-service', () => ({
  externalConsumerService: {
    ...jest.requireActual('../services/external-consumer-service')
      .externalConsumerService,
    deleteReports: (...args) => mockDeleteReports(...args),
  },
}));

jest.mock('../services/report-service', () => ({
  reportService: {
    deleteReports: (...args) => mockDeleteReports(...args),
  },
}));

const mockRetrieveErrors = jest.fn();
jest.mock('../services/error-service', () => ({
  errorService: {
    retrieveErrors: (...args) => mockRetrieveErrors(...args),
  },
}));

let app: Application;
const REPORT = {
  report_id: faker.string.uuid(),
  company_id: faker.string.uuid(),
  naics_code: '11',
  create_date: faker.date.past(),
  update_date: faker.date.past(),
  data_constraints: faker.lorem.sentence(),
  user_comment: faker.lorem.sentence(),
  revision: '12',
  report_start_date: faker.date.past(),
  report_end_date: faker.date.past(),
  report_status: 'Published',
  company_name: faker.company.name(),
  company_province: faker.location.state(),
  company_bceid_business_guid: faker.string.uuid(),
  company_country: faker.location.country(),
  company_city: faker.location.city(),
  company_postal_code: faker.location.zipCode(),
  company_address_line1: faker.location.streetAddress(),
  company_address_line2: faker.location.streetAddress(),

  employee_count_range: '50-299',
  naics_code_label: faker.lorem.words(3),
  calculated_data: [
    {
      value: faker.number.float(),
      is_suppressed: false,
      calculation_code: faker.number.int(),
    },
  ],
};

describe('external-consumer-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('', router);
  });

  describe('/ GET', () => {
    it('should return data if user doeas not send query params', () => {
      mockCount.mockReturnValue(1);
      mockReportsViewFindMany.mockReturnValue([REPORT]);
      return request(app)
        .get('')
        .set('x-api-key', 'api-key')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({
            page: 0,
            pageSize: 50,
            totalRecords: 1,
            records: [
              {
                calculated_data: [
                  {
                    calculation_code:
                      REPORT.calculated_data[0].calculation_code,
                    is_suppressed: REPORT.calculated_data[0].is_suppressed,
                    value: REPORT.calculated_data[0].value,
                  },
                ],
                company_address_line1: REPORT.company_address_line1,
                company_address_line2: REPORT.company_address_line2,
                company_bceid_business_guid: REPORT.company_bceid_business_guid,
                company_city: REPORT.company_city,
                company_country: REPORT.company_country,
                company_id: REPORT.company_id,
                company_name: REPORT.company_name,
                company_postal_code: REPORT.company_postal_code,
                company_province: REPORT.company_province,
                create_date: REPORT.create_date.toISOString(),
                data_constraints: REPORT.data_constraints,
                employee_count_range: REPORT.employee_count_range,
                naics_code: REPORT.naics_code,
                naics_code_label: REPORT.naics_code_label,
                report_end_date: REPORT.report_end_date.toISOString(),
                report_id: REPORT.report_id,
                report_start_date: REPORT.report_start_date.toISOString(),
                report_status: REPORT.report_status,
                revision: REPORT.revision,
                update_date: REPORT.update_date.toISOString(),
                user_comment: REPORT.user_comment,
              },
            ],
          });
        });
    });
    it('should fail if page or pageSize are not numbers', () => {
      return request(app)
        .get('')
        .query({ offset: 'one', limit: '1oooo' })
        .set('x-api-key', 'api-key')
        .expect(400)
        .expect(({ body }) => {
          expect(body).toEqual({
            error: 'Invalid offset or limit',
          });
        });
    });
    it('should fail if request fails to get reports', () => {
      mockReportsViewFindMany.mockRejectedValue({});
      return request(app).get('').expect(200);
    });
  });

  describe('/ DELETE', () => {
    it('should delete reports', () => {
      return request(app)
        .delete('/')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({
            error: false,
            message: 'Reports deleted',
          });
        });
    });
    it('should fail delete reports and return error', () => {
      mockDeleteReports.mockRejectedValue({
        message: 'Failed to delete reports',
      });
      return request(app)
        .delete('/')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({
            error: true,
            message: 'Failed to delete reports',
          });
        });
    });
  });

  describe('GET /errors', () => {
    it('should forward the input to the service', async () => {
      await request(app)
        .get('/errors')
        .query({
          startDate: '2024-06-20 10:20',
          endDate: '2024-06-20 10:20',
          page: '2',
          limit: '10',
        })
        .expect(200);
      expect(mockRetrieveErrors).toHaveBeenCalledWith(
        '2024-06-20 10:20',
        '2024-06-20 10:20',
        '2',
        '10',
      );
    });
    it('should fail if request fails', () => {
      mockRetrieveErrors.mockRejectedValue({});
      return request(app)
        .get('/errors')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toMatchObject({
            error: true,
          });
        });
    });
  });
});
