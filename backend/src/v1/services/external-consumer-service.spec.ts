import { faker } from '@faker-js/faker';
import { externalConsumerService } from './external-consumer-service';
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

const testData = {
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
  history: [
    {
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
      naics_code_report_history_naics_codeTonaics_code: {
        naics_code: '11',
        naics_label: faker.lorem.words(3),
      },
      calculated_data_history: [
        {
          value: faker.number.float(),
          is_suppressed: false,
          calculation_code: { calculation_code: `${faker.number.int()}` },
        },
      ],
    },
  ],
};

describe('external-consumer-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return reports with defaults values', async () => {
    mockCount.mockReturnValue(1);
    mockFindMany.mockReturnValue([testData]);
    const results = await externalConsumerService.exportDataWithPagination();
    expect(results.page).toBe(0);
    expect(results.pageSize).toBe(1000), expect(results.totalRecords).toBe(1);
    expect(results.records[0]).toStrictEqual({
      calculated_data: [
        {
          is_suppressed:
            testData.pay_transparency_calculated_data[0].is_suppressed,
          value: testData.pay_transparency_calculated_data[0].value,
          calculation_code:
            testData.pay_transparency_calculated_data[0].calculation_code
              .calculation_code,
        },
      ],
      company_address_line1: testData.pay_transparency_company.address_line1,
      company_address_line2: testData.pay_transparency_company.address_line2,
      company_bceid_business_guid:
        testData.pay_transparency_company.bceid_business_guid,
      company_city: testData.pay_transparency_company.city,
      company_country: testData.pay_transparency_company.country,
      company_id: testData.company_id,
      company_name: testData.pay_transparency_company.company_name,
      company_postal_code: testData.pay_transparency_company.postal_code,
      company_province: testData.pay_transparency_company.province,
      create_date: testData.create_date,
      data_constraints: testData.data_constraints,
      employee_count_range: testData.employee_count_range.employee_count_range,
      naics_code:
        testData.naics_code_pay_transparency_report_naics_codeTonaics_code
          .naics_code,
      naics_code_label:
        testData.naics_code_pay_transparency_report_naics_codeTonaics_code
          .naics_label,
      report_end_date: testData.report_end_date,
      report_id: testData.report_id,
      report_start_date: testData.report_start_date,
      report_status: testData.report_status,
      revision: testData.revision,
      update_date: testData.update_date,
      user_comment: testData.user_comment,
      history: [
        {
          calculated_data: [
            {
              is_suppressed:
                testData.history[0].calculated_data_history[0].is_suppressed,
              value: testData.history[0].calculated_data_history[0].value,
              calculation_code:
                testData.history[0].calculated_data_history[0].calculation_code
                  .calculation_code,
            },
          ],
          company_address_line1:
            testData.history[0].pay_transparency_company.address_line1,
          company_address_line2:
            testData.history[0].pay_transparency_company.address_line2,
          company_bceid_business_guid:
            testData.history[0].pay_transparency_company.bceid_business_guid,
          company_city: testData.history[0].pay_transparency_company.city,
          company_country: testData.history[0].pay_transparency_company.country,
          company_id: testData.history[0].company_id,
          company_name: testData.history[0].pay_transparency_company.company_name,
          company_postal_code: testData.history[0].pay_transparency_company.postal_code,
          company_province: testData.history[0].pay_transparency_company.province,
          create_date: testData.history[0].create_date,
          data_constraints: testData.history[0].data_constraints,
          employee_count_range:
            testData.history[0].employee_count_range.employee_count_range,
          naics_code:
            testData.history[0].naics_code_report_history_naics_codeTonaics_code
              .naics_code,
          naics_code_label:
            testData.history[0].naics_code_report_history_naics_codeTonaics_code
              .naics_label,
          report_end_date: testData.history[0].report_end_date,
          report_id: testData.history[0].report_id,
          report_start_date: testData.history[0].report_start_date,
          report_status: testData.history[0].report_status,
          revision: testData.history[0].revision,
          update_date: testData.history[0].update_date,
          user_comment: testData.history[0].user_comment,
        },
      ],
    });
  });

  it('should parse date strings', async () => {
    mockCount.mockReturnValue(1);
    mockFindMany.mockReturnValue([testData]);
    const results = await externalConsumerService.exportDataWithPagination(
      '2024-01-01',
      '2024-01-01',
      -1,
      -1,
    );
    expect(results.page).toBe(0);
    expect(results.pageSize).toBe(1000), expect(results.totalRecords).toBe(1);
  });

  it('should fail parse invalid date strings', async () => {
    mockCount.mockReturnValue(1);
    mockFindMany.mockReturnValue([testData]);
    try {
      await externalConsumerService.exportDataWithPagination(
        '20241-01-01',
        '20241-01-01',
        -1,
        -1,
      );
    } catch (error) {
      expect(error.message).toBe(
        'Failed to parse dates. Please use date format YYYY-MM-dd',
      );
    }
  });
  it('should fail when endDate is before the startDate', async () => {
    mockCount.mockReturnValue(1);
    mockFindMany.mockReturnValue([testData]);
    try {
      await externalConsumerService.exportDataWithPagination(
        '2024-01-01',
        '2023-01-01',
        -1,
        -1,
      );
    } catch (error) {
      expect(error.message).toBe('Start date must be before the end date.');
    }
  });
});
