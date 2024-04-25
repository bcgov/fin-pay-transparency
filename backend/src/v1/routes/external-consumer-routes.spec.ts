import express, { Application } from 'express';
import request from 'supertest';
import router from './external-consumer-routes';
import { faker } from '@faker-js/faker';

const mockCount = jest.fn();
const mockFindMany = jest.fn();
jest.mock('../prisma/prisma-client-readonly-replica', () => {
  return {
    __esModule: true,
    default: {
      $replica: () => {
        return {
          pay_transparency_report: {
            count: () => mockCount(),
            findMany: (...args) => mockFindMany(...args),
          },
        };
      },
    },
  };
});

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
  pay_transparency_company: {
    company_name: faker.company.name(),
    province: faker.location.state(),
    bceid_business_guid: faker.string.uuid(),
    country: faker.location.country(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    address_line1: faker.location.streetAddress(),
    address_line2: faker.location.streetAddress(),
  },
  employee_count_range: {
    employee_count_range: '50-299',
  },
  naics_code_pay_transparency_report_naics_codeTonaics_code: {
    naics_code: '11',
    naics_label: faker.lorem.words(3),
  },
  pay_transparency_calculated_data: [
    {
      value: faker.number.float(),
      is_suppressed: false,
      calculation_code: { calculation_code: `${faker.number.int()}` },
    },
  ],
  report_history: [],
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
      mockFindMany.mockReturnValue([REPORT]);
      return request(app)
        .get('')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual({
            page: 0,
            pageSize: 1000,
            records: [
              {
                calculated_data: [
                  {
                    calculation_code:
                      REPORT.pay_transparency_calculated_data[0]
                        .calculation_code.calculation_code,
                    is_suppressed:
                      REPORT.pay_transparency_calculated_data[0].is_suppressed,
                    value: REPORT.pay_transparency_calculated_data[0].value,
                  },
                ],
                company_address_line1:
                  REPORT.pay_transparency_company.address_line1,
                company_address_line2:
                  REPORT.pay_transparency_company.address_line2,
                company_bceid_business_guid:
                  REPORT.pay_transparency_company.bceid_business_guid,
                company_city: REPORT.pay_transparency_company.city,
                company_country: REPORT.pay_transparency_company.country,
                company_id: REPORT.company_id,
                company_name: REPORT.pay_transparency_company.company_name,
                company_postal_code:
                  REPORT.pay_transparency_company.postal_code,
                company_province: REPORT.pay_transparency_company.province,
                create_date: REPORT.create_date.toISOString(),
                data_constraints: REPORT.data_constraints,
                employee_count_range:
                  REPORT.employee_count_range.employee_count_range,
                naics_code:
                  REPORT
                    .naics_code_pay_transparency_report_naics_codeTonaics_code
                    .naics_code,
                naics_code_label:
                  REPORT
                    .naics_code_pay_transparency_report_naics_codeTonaics_code
                    .naics_label,
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
        .expect(400)
        .expect(({ body }) => {
          expect(body).toEqual({
            error: 'Invalid offset or limit',
          });
        });
    });
    it('should fail if request fails to get reports', () => {
      mockFindMany.mockRejectedValue({});
      return request(app).get('').expect(200);
    });
  });
});
