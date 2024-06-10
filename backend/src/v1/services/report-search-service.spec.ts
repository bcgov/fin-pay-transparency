import createPrismaMock from 'prisma-mock';
import { Prisma } from '@prisma/client';
import { reportSearchService } from './report-search-service';

const company1 = {
  company_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
  company_name: 'Company Name 1',
};
const company2 = {
  company_id: '4492feff-99d7-4b2b-8896-12a59a75d4e2',
  company_name: 'Company Name 2',
};

const prismaClient: any = createPrismaMock({
  pay_transparency_report: [
    {
      report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
      create_date: '2024-04-19 21:46:53.876',
      naics_code: '30',
      reporting_year: 2024,
      is_unlocked: true,
      employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
      company_id: company1.company_id,
    },
    {
      report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e2',
      create_date: '2023-04-19 21:46:53.876',
      naics_code: '11',
      reporting_year: 2023,
      is_unlocked: false,
      employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e9',
      company_id: company2.company_id,
    },
    {
      report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
      create_date: '2022-04-19 21:46:53.876',
      naics_code: '40',
      reporting_year: 2021,
      is_unlocked: false,
      employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e5',
      company_id: company2.company_id,
    },
  ],
  pay_transparency_company: [company2, company1],
});

jest.mock('../prisma/prisma-client-readonly-replica', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client-readonly-replica'),
  default: {
    pay_transparency_report: {
      findMany: (args) => prismaClient.pay_transparency_report.findMany(args),
      count: (args) => prismaClient.pay_transparency_report.count(args),
    },
  },
}));

describe('report-search-service', () => {
  it('should return unsorted and unfiltered reports', async () => {
    const response = await reportSearchService.searchReport(0, 10, '[]', '[]');
    expect(response.total).toBe(3);
  });

  it('should throw error if query params cannot be parsed', async () => {
    try {
      
      await reportSearchService.searchReport(0, 10, '', '');
    } catch (error) {
      expect(error.message).toEqual('Invalid query parameters');
    }
  });
  
  describe('pagination', () => {
    it('should default limit to 20 if not specified', async() => {
      const response = await reportSearchService.searchReport(0, undefined, '[]', '[]');
      expect(response.limit).toBe(20);
    });
    it('should default limit to 20 if more than 100', async() => {
      const response = await reportSearchService.searchReport(0, 101, '[]', '[]');
      expect(response.limit).toBe(20);
    });
  });

  describe('filtering', () => {
    describe('reporting year', () => {
      it('eq', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "reporting_year", "operation": "eq", "value": 2024 }]',
        );
        expect(response.total).toBe(1);
      });

      it('neq', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "reporting_year", "operation": "neq", "value": 2024 }]',
        );
      });
      it('lt', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "reporting_year", "operation": "lt", "value": 2024 }]',
        );
        expect(response.total).toBe(2);
      });
      it('lte', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "reporting_year", "operation": "lte", "value": 2024 }]',
        );
        expect(response.total).toBe(3);
      });
      it('gt', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "reporting_year", "operation": "gt", "value": 2024 }]',
        );
        expect(response.total).toBe(0);
      });
      it('gte', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "reporting_year", "operation": "gte", "value": 2024 }]',
        );
        expect(response.total).toBe(1);
      });
    });

    describe('naics_code', () => {
      describe('with a non empty array', () => {
        it('should return reports with code matching the specified values', async () => {
          const response = await reportSearchService.searchReport(
            0,
            10,
            '[]',
            '[{"key": "naics_code", "operation": "in", "value": ["11"] }]',
          );
          expect(response.total).toBe(1);
        });
      });

      describe('with empty array', () => {
        it('should not return reports', async () => {
          const response = await reportSearchService.searchReport(
            0,
            10,
            '[]',
            '[{"key": "naics_code", "operation": "in", "value": [] }]',
          );
          expect(response.total).toBe(0);
        });
      });
    });
    describe('employee_count_range', () => {
      describe('in', () => {
        describe('with a non empty array', () => {
          it('should return reports with count range matching the specified values', async () => {
            const response = await reportSearchService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "employee_count_range_id", "operation": "in", "value": ["4492feff-99d7-4b2b-8896-12a59a75d4e1"] }]',
            );
            expect(response.total).toBe(1);
          });
        });

        describe('with empty array', () => {
          it('should return empty reports with count range matching the specified values', async () => {
            const response = await reportSearchService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "employee_count_range_id", "operation": "in", "value": [] }]',
            );
            expect(response.total).toBe(0);
          });
        });
      });
      describe('notin', () => {
        it('should return reports with count range matching the specified values', async () => {
          const response = await reportSearchService.searchReport(
            0,
            10,
            '[]',
            '[{"key": "employee_count_range_id", "operation": "notin", "value": ["4492feff-99d7-4b2b-8896-12a59a75d4e1"] }]',
          );
        });
      });
    });

    describe('create_date / submission date', () => {
      it('should return reports with create_date between the specified dates', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "create_date", "operation": "between", "value": ["2024-01-01 21:46:53.876", "2024-05-05 21:46:53.876"] }]',
        );
        expect(response.total).toBe(1);
      });

      it('should not return reports', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "create_date", "operation": "between", "value": [] }]',
        );
        expect(response.total).toBe(0);
      });
    });
    describe('is_unlocked', () => {
      it('should return all unlocked reports', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "is_unlocked", "operation": "eq", "value": true }]',
        );
        expect(response.total).toBe(1);
      });

      it('should return locked reports', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[]',
          '[{"key": "is_unlocked", "operation": "eq", "value": false }]',
        );
        expect(response.total).toBe(2);
      });
    });

    describe('relations', () => {
      describe('company_name', () => {
        it('should filter by company name', async () => {
          const response = await reportSearchService.searchReport(
            0,
            10,
            '[]',
            '[{"key": "company_name", "operation": "like", "value": "Company name 1" }]',
          );
          expect(response.total).toBe(1);
        });
      });
    });
  });

  describe('sorting', () => {
    describe('reporting year', () => {
      it('asc', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[{"reporting_year": "asc" }]',
          '[]',
        );

        expect(response.total).toBe(3);
        expect(response.reports[0].reporting_year).toBe(2021);
        expect(response.reports[1].reporting_year).toBe(2023);
        expect(response.reports[2].reporting_year).toBe(2024);
      });

      it('desc', async () => {
        const response = await reportSearchService.searchReport(
          0,
          10,
          '[{"reporting_year": "desc" }]',
          '[]',
        );

        expect(response.total).toBe(3);
        expect(response.reports[0].reporting_year).toBe(2024);
        expect(response.reports[1].reporting_year).toBe(2023);
        expect(response.reports[2].reporting_year).toBe(2021);
      });
    });

    describe('relations', () => {
      describe('company_name', () => {

        it('should sort by company name', async () => {
          const response = await reportSearchService.searchReport(
            0,
            10,
            '[{"company_name": "asc" }]',
            '[]',
          );
          expect(response.reports[0].pay_transparency_company.company_name).toBe('Company Name 1');
          expect(response.reports[1].pay_transparency_company.company_name).toBe('Company Name 2');
        });
      });
    });
  });
});
