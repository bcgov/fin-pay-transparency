import { vi, describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  externalConsumerService,
  inputDateTimeFormatter,
} from './external-consumer-service.js';
import { LocalDateTime, ZoneId } from '@js-joda/core';
import replica from '../prisma/__mocks__/prisma-client-readonly-replica.js';
import type { reports_calculated_data_view } from '@prisma/client';

const mockReportsViewFindMany = replica.reports_calculated_data_view.findMany;
vi.mock('../prisma/prisma-client-readonly-replica');

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
  reporting_year: 2024,
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
} as unknown as reports_calculated_data_view;

describe('external-consumer-service', () => {
  it('should return reports with defaults values', async () => {
    mockReportsViewFindMany.mockResolvedValue([testData]);
    const results = await externalConsumerService.exportDataWithPagination();
    expect(results.page).toBe(0);
    expect(results.records[0]).toStrictEqual({
      calculated_data: [
        {
          is_suppressed: testData.calculated_data[0].is_suppressed,
          value: testData.calculated_data[0].value,
          calculation_code: testData.calculated_data[0].calculation_code,
        },
      ],
      company_address_line1: testData.company_address_line1,
      company_address_line2: testData.company_address_line2,
      company_bceid_business_guid: testData.company_bceid_business_guid,
      company_city: testData.company_city,
      company_country: testData.company_country,
      company_id: testData.company_id,
      company_name: testData.company_name,
      company_postal_code: testData.company_postal_code,
      company_province: testData.company_province,
      create_date: testData.create_date,
      data_constraints: testData.data_constraints,
      employee_count_range: testData.employee_count_range,
      naics_code: testData.naics_code,
      naics_code_label: testData.naics_code_label,
      report_end_date: testData.report_end_date,
      report_id: testData.report_id,
      report_start_date: testData.report_start_date,
      report_status: testData.report_status,
      reporting_year: testData.reporting_year,
      revision: testData.revision,
      update_date: testData.update_date,
      user_comment: testData.user_comment,
    });
  });

  it('should parse date strings', async () => {
    mockReportsViewFindMany.mockResolvedValue([testData]);
    const results = await externalConsumerService.exportDataWithPagination(
      '2024-01-01 11:00',
      '2024-01-01 11:00',
      -1,
      -1,
    );
    expect(results.page).toBe(0);
  });

  it('should fail parse invalid date strings', async () => {
    mockReportsViewFindMany.mockResolvedValue([testData]);
    try {
      await externalConsumerService.exportDataWithPagination(
        '20241-01-01 11:00',
        '20241-01-02 11:00',
        -1,
        -1,
      );
    } catch (error) {
      expect(error.message).toBe(
        'Failed to parse dates. Please use date format YYYY-MM-dd HH:mm:ss',
      );
    }
  });
  it('should fail when endDate is before the startDate', async () => {
    mockReportsViewFindMany.mockResolvedValue([testData]);
    try {
      await externalConsumerService.exportDataWithPagination(
        '2024-01-01 11:00',
        '2023-01-01 11:00',
        -1,
        -1,
      );
    } catch (error) {
      expect(error.message).toBe(
        'Start date time must be before the end date time.',
      );
    }
  });

  it('should fail if startDate is in the future', async () => {
    mockReportsViewFindMany.mockResolvedValue([testData]);
    try {
      await externalConsumerService.exportDataWithPagination(
        LocalDateTime.now()
          .atZone(ZoneId.UTC)
          .plusHours(24)
          .format(inputDateTimeFormatter),
        '2023-01-01 11:00',
        -1,
        -1,
      );
    } catch (error) {
      expect(error.message).toBe('Start date cannot be in the future');
    }
  });
  it('should fail if endDate is in the future', async () => {
    mockReportsViewFindMany.mockResolvedValue([testData]);
    try {
      await externalConsumerService.exportDataWithPagination(
        '2023-01-01 11:00',
        LocalDateTime.now()
          .atZone(ZoneId.UTC)
          .plusHours(24)
          .format(inputDateTimeFormatter),
        -1,
        -1,
      );
    } catch (error) {
      expect(error.message).toBe('End date cannot be in the future');
    }
  });

  describe('should default page size to 50', () => {
    it('when page size is not specified', async () => {
      mockReportsViewFindMany.mockResolvedValue([testData]);
      await externalConsumerService.exportDataWithPagination(
        '2024-01-01 11:00',
        '2024-01-01 11:00',
        0,
        undefined,
      );
      expect(mockReportsViewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it('when page size is greater than max value (50)', async () => {
      mockReportsViewFindMany.mockResolvedValue([testData]);
      await externalConsumerService.exportDataWithPagination(
        '2024-01-01 11:00',
        '2024-01-01 11:00',
        0,
        100,
      );
      expect(mockReportsViewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it('when page size is less than 1', async () => {
      mockReportsViewFindMany.mockResolvedValue([testData]);
      await externalConsumerService.exportDataWithPagination(
        '2024-01-01 11:00',
        '2024-01-01 11:00',
        0,
        -1,
      );
      expect(mockReportsViewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });
});
