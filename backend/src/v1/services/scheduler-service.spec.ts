import prisma from '../prisma/prisma-client';
import { Prisma } from '@prisma/client';
import type { pay_transparency_report } from '@prisma/client';
import { enumReportStatus } from './report-service';
import { LocalDate, ZoneId, convert } from '@js-joda/core';
import { schedulerService } from './scheduler-service';

jest.mock('./utils-service');
jest.mock('../prisma/prisma-client', () => {
  return {
    pay_transparency_report: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    pay_transparency_calculated_data: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

const mockReportInDB = {
  report_id_a: '00001aff-117e-7678-cd51-31a3dd198778',
  report_id_b: '00002aff-117e-7678-cd51-31a3dd198778',
};
const mockCalculatedDatasInDB = [
  {
    calculated_data_id: '43dcf60a-9c33-3282-9bba-43c0e2227cc2',
    report_id: mockReportInDB.report_id_a,
    calculation_code_id: '9ffb4434-bc23-b98a-87c7-6cc3dd19a214',
    value: '100',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_1',
    },
  },
  {
    calculated_data_id: '53dcf60a-9c33-3282-9bba-43c0e2227321',
    report_id: mockReportInDB.report_id_a,
    calculation_code_id: '8ffb4434-bc23-b98a-87c7-5cc3dd19a210',
    value: '99',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_2',
    },
  },
  {
    calculated_data_id: '63dcf60a-9c33-3282-9bba-43c0e2227567',
    report_id: mockReportInDB.report_id_a,
    calculation_code_id: '7ffb4434-bc23-b98a-87c7-4cc3dd19a212',
    value: '98',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_3',
    },
  },
  {
    calculated_data_id: '43dcf60a-9c33-3282-9bba-43c0e2227c66',
    report_id: mockReportInDB.report_id_b,
    calculation_code_id: '9ffb4434-bc23-b98a-87c7-6cc3dd19a217',
    value: '97',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_4',
    },
  },
  {
    calculated_data_id: '53dcf60a-9c33-3282-9bba-43c0e2227377',
    report_id: mockReportInDB.report_id_b,
    calculation_code_id: '8ffb4434-bc23-b98a-87c7-5cc3dd19a219',
    value: '96',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_5',
    },
  },
  {
    calculated_data_id: '63dcf60a-9c33-3282-9bba-43c0e2227588',
    report_id: mockReportInDB.report_id_b,
    calculation_code_id: '7ffb4434-bc23-b98a-87c7-4cc3dd19a213',
    value: '95',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_6',
    },
  },
];

const mockPublishedReport: pay_transparency_report = {
  report_id: mockReportInDB.report_id_a,
  company_id: '255677',
  user_id: '1232344',
  user_comment: null,
  employee_count_range_id: '67856345',
  naics_code: '234234',
  report_start_date: convert(LocalDate.now(ZoneId.UTC)).toDate(),
  report_end_date: convert(LocalDate.now(ZoneId.UTC).plusYears(1)).toDate(),
  create_date: new Date(),
  update_date: new Date(),
  create_user: 'User',
  update_user: 'User',
  report_status: enumReportStatus.Published,
  revision: new Prisma.Decimal(1),
  data_constraints: null,
  is_unlocked: true,
};

const mockDraftReport: pay_transparency_report = {
  ...mockPublishedReport,
  report_id: mockReportInDB.report_id_b,
  user_id: '5265928',
  report_status: enumReportStatus.Draft,
};

describe('deleteDraftReports', () => {
  describe('if db contains at least 1 draft report', () => {
    /*
    it('throws an error', async () => {
      await expect(
        schedulerService.deleteDraftReports(),
      ).rejects.toThrow();
    });
    */
  });
});
