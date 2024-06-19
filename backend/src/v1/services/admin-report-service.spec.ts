import createPrismaMock from 'prisma-mock';
import { adminReportService } from './admin-report-service';
import { LocalDateTime, ZoneOffset } from '@js-joda/core';

const company1 = {
  company_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
  company_name: 'Company Name 1',
};
const company2 = {
  company_id: '4492feff-99d7-4b2b-8896-12a59a75d4e2',
  company_name: 'Company Name 2',
};

let companies = [];
let reports = [];
let prismaClient: any;

const mockFindMany = jest.fn();

jest.mock('../prisma/prisma-client-readonly-replica', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client-readonly-replica'),
  default: {
    pay_transparency_report: {
      findMany: (args) => {
        mockFindMany(args);
        return prismaClient.pay_transparency_report.findMany(args);
      },
      findUniqueOrThrow: (args) =>
        prismaClient.pay_transparency_report.findUniqueOrThrow(args),
      findUnique: (args) =>
        prismaClient.pay_transparency_report.findUnique(args),
      count: (args) => prismaClient.pay_transparency_report.count(args),
    },
  },
}));
jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client'),
  default: {
    pay_transparency_report: {
      findUniqueOrThrow: (args) => {
        console.log(args);
        return prismaClient.pay_transparency_report.findUniqueOrThrow(args);
      },
      findUnique: (args) =>
        prismaClient.pay_transparency_report.findUnique(args),
      update: (args) => prismaClient.pay_transparency_report.update(args),
    },
    $extends: jest.fn(),
  },
}));

describe('admin-report-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reports = [
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
        create_date: '2024-04-19T21:46:53.876',
        naics_code: '30',
        report_status: 'Published',
        reporting_year: 2024,
        is_unlocked: true,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
        company_id: company1.company_id,
      },
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        create_date: '2023-04-19T21:46:53.876',
        naics_code: '11',
        report_status: 'Published',
        reporting_year: 2023,
        is_unlocked: false,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e9',
        company_id: company2.company_id,
      },
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
        create_date: '2022-04-19T21:46:53.876',
        naics_code: '40',
        report_status: 'Published',
        reporting_year: 2021,
        is_unlocked: false,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e5',
        company_id: company2.company_id,
      },
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d499',
        create_date: '2022-04-19T21:46:53.876',
        naics_code: '40',
        report_status: 'Draft',
        reporting_year: 2021,
        is_unlocked: false,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e5',
        company_id: company2.company_id,
      },
    ];
    companies = [company2, company1];

    prismaClient = createPrismaMock({
      pay_transparency_report: reports,
      pay_transparency_company: companies,
    });
  });
  describe('searchReports', () => {
    it('should return unsorted and unfiltered reports', async () => {
      const response = await adminReportService.searchReport(0, 10, '[]', '[]');
      expect(response.total).toBe(3);
    });

    it('should throw error if query params cannot be parsed', async () => {
      try {
        await adminReportService.searchReport(0, 10, '', '');
      } catch (error) {
        expect(error.message).toEqual('Invalid query parameters');
      }
    });

    describe('pagination', () => {
      it('should default limit to 20 if not specified', async () => {
        const response = await adminReportService.searchReport(
          0,
          undefined,
          '[]',
          '[]',
        );
        expect(response.limit).toBe(20);
      });
      it('should default limit to 20 if more than 100', async () => {
        const response = await adminReportService.searchReport(
          0,
          101,
          '[]',
          '[]',
        );
        expect(response.limit).toBe(20);
      });
    });

    describe('filtering', () => {
      describe('when filter is valid', () => {
        describe('reporting year', () => {
          it('eq', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "reporting_year", "operation": "eq", "value": 2024 }]',
            );
            expect(
              response.reports.every((x) => x.reporting_year === 2024),
            ).toBe(true);
          });

          it('neq', async () => {
            await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "reporting_year", "operation": "neq", "value": 2024 }]',
            );
            const { where } = mockFindMany.mock.calls[0][0];
            expect(where.reporting_year).toEqual({
              not: { eq: 2024 },
            });
          });
          it('lt', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "reporting_year", "operation": "lt", "value": 2024 }]',
            );
            expect(
              response.reports.every((x) => x.reporting_year < 2024),
            ).toBeTruthy();
          });
          it('lte', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "reporting_year", "operation": "lte", "value": 2024 }]',
            );
            expect(
              response.reports.every((x) => x.reporting_year <= 2024),
            ).toBeTruthy();
          });
          it('gt', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "reporting_year", "operation": "gt", "value": 2024 }]',
            );
            expect(
              response.reports.every((x) => x.reporting_year > 2024),
            ).toBeTruthy();
          });
          it('gte', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "reporting_year", "operation": "gte", "value": 2024 }]',
            );
            expect(
              response.reports.every((x) => x.reporting_year >= 2024),
            ).toBeTruthy();
          });
        });

        describe('naics_code', () => {
          describe('with a non empty array', () => {
            it('should return reports with code matching the specified values', async () => {
              const response = await adminReportService.searchReport(
                0,
                10,
                '[]',
                '[{"key": "naics_code", "operation": "in", "value": ["11"] }]',
              );
              expect(
                response.reports.every((x) => x.naics_code === '11'),
              ).toBeTruthy();
            });
          });

          describe('with empty array', () => {
            it('should not return reports', async () => {
              const response = await adminReportService.searchReport(
                0,
                10,
                '[]',
                '[{"key": "naics_code", "operation": "in", "value": [] }]',
              );
              expect(response.reports.length).toBe(0);
            });
          });
        });
        describe('employee_count_range', () => {
          describe('in', () => {
            describe('with a non empty array', () => {
              it('should return reports with count range matching the specified values', async () => {
                const response = await adminReportService.searchReport(
                  0,
                  10,
                  '[]',
                  '[{"key": "employee_count_range_id", "operation": "in", "value": ["4492feff-99d7-4b2b-8896-12a59a75d4e1"] }]',
                );
                expect(
                  response.reports.every(
                    (x) =>
                      x.employee_count_range_id ===
                      '4492feff-99d7-4b2b-8896-12a59a75d4e1',
                  ),
                ).toBeTruthy();
              });
            });

            describe('with empty array', () => {
              it('should return empty reports with count range matching the specified values', async () => {
                const response = await adminReportService.searchReport(
                  0,
                  10,
                  '[]',
                  '[{"key": "employee_count_range_id", "operation": "in", "value": [] }]',
                );
                expect(response.reports.length).toBe(0);
              });
            });
          });
          describe('notin', () => {
            it('should return reports with count range matching the specified values', async () => {
              await adminReportService.searchReport(
                0,
                10,
                '[]',
                '[{"key": "employee_count_range_id", "operation": "notin", "value": ["4492feff-99d7-4b2b-8896-12a59a75d4e1"] }]',
              );

              const { where } = mockFindMany.mock.calls[0][0];
              expect(where.employee_count_range_id).toEqual({
                not: { in: ['4492feff-99d7-4b2b-8896-12a59a75d4e1'] },
              });
            });
          });
        });

        describe('create_date / submission date', () => {
          it('should return reports with create_date between the specified dates', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "create_date", "operation": "between", "value": ["2024-01-01T21:46:53.876", "2024-05-05T21:46:53.876"] }]',
            );
            expect(
              response.reports.every((x) => {
                const createDate = LocalDateTime.parse(
                  x.create_date,
                ).toEpochSecond(ZoneOffset.UTC);
                const rangeStart = LocalDateTime.parse(
                  '2024-01-01T21:46:53.876',
                ).toEpochSecond(ZoneOffset.UTC);
                const rangeEnd = LocalDateTime.parse(
                  '2024-05-05T21:46:53.876',
                ).toEpochSecond(ZoneOffset.UTC);
                return createDate >= rangeStart && createDate < rangeEnd;
              }),
            ).toBeTruthy();
          });

          it('should not return reports', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "create_date", "operation": "between", "value": [] }]',
            );
            expect(response.reports.length).toBe(0);
          });
        });
        describe('is_unlocked', () => {
          it('should return all unlocked reports', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "is_unlocked", "operation": "eq", "value": true }]',
            );
            expect(response.reports.every((x) => x.is_unlocked)).toBeTruthy();
          });

          it('should return locked reports', async () => {
            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "is_unlocked", "operation": "eq", "value": false }]',
            );
            expect(response.reports.every((x) => !x.is_unlocked)).toBeTruthy();
          });
        });

        describe('relations', () => {
          describe('company_name', () => {
            it('should filter by company name', async () => {
              const response = await adminReportService.searchReport(
                0,
                10,
                '[]',
                '[{"key": "company_name", "operation": "like", "value": "Company name 1" }]',
              );
              expect(
                response.reports.every((x) =>
                  x.pay_transparency_company.company_name
                    .toLowerCase()
                    .includes('company name 1'),
                ),
              ).toBeTruthy();
            });
          });
        });
      });

      describe('when filter is invalid', () => {
        it('should fail if key is invalid', async () => {
          try {
            expect(
              await adminReportService.searchReport(
                0,
                101,
                '[]',
                '[{"key": "invalid", "operation": "eq", "value": 1}]',
              ),
            ).toThrow();
          } catch (error) {
            expect(error.errors.map((error) => error.message)).toContain(
              'key must be one of the following values: create_date, naics_code, reporting_year, is_unlocked, employee_count_range_id',
            );
          }
        });
        it('should fail if operation is invalid for the specified key', async () => {
          try {
            expect(
              await adminReportService.searchReport(
                0,
                101,
                '[]',
                '[{"key": "create_date", "operation": "eq", "value": ["2024-04-19 21:46:53.876", "2024-04-19 21:46:53.876"]}]',
              ),
            ).toThrow();
          } catch (error) {
            expect(error.errors.map((error) => error.message)).toContain(
              'Missing or invalid operation',
            );
          }
        });
        it('should fail if operation is missing', async () => {
          try {
            expect(
              await adminReportService.searchReport(
                0,
                101,
                '[]',
                '[{"key": "create_date", "value": []}]',
              ),
            ).toThrow();
          } catch (error) {
            expect(error.errors.map((error) => error.message)).toContain(
              'Missing operation',
            );
          }
        });

        it('should fail if filter value is invalid for the specified key', async () => {
          try {
            expect(
              await adminReportService.searchReport(
                0,
                101,
                '[]',
                '[{"key": "is_unlocked", "operation": "eq", "value": []}]',
              ),
            ).toThrow();
          } catch (error) {
            expect(error.errors.map((error) => error.message)).toContain(
              'Invalid or missing filter value',
            );
          }
        });
      });
    });

    describe('sorting', () => {
      describe('reporting year', () => {
        it('asc', async () => {
          const response = await adminReportService.searchReport(
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
          const response = await adminReportService.searchReport(
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
            const response = await adminReportService.searchReport(
              0,
              10,
              '[{"company_name": "asc" }]',
              '[]',
            );
            expect(
              response.reports[0].pay_transparency_company.company_name,
            ).toBe('Company Name 1');
            expect(
              response.reports[1].pay_transparency_company.company_name,
            ).toBe('Company Name 2');
          });
        });
      });
    });
  });

  describe('changeReportLockStatus', () => {
    it('should throw error if report does not exist', async () => {
      await expect(
        adminReportService.changeReportLockStatus(
          '5492feff-99d7-4b2b-8896-12a59a75d4e2',
          'asasasa',
          true,
        ),
      ).rejects.toThrow();
    });

    it('should change report is_unlocked to true', async () => {
      const report = await adminReportService.changeReportLockStatus(
        '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        'username',
        true,
      );
      expect(report.is_unlocked).toBeTruthy();
      expect(report.idir_modified_date).toBe(report.report_unlock_date);
      expect(report.idir_modified_username).toBe('username');
    });
    it('should change report is_unlocked to false', async () => {
      const report = await adminReportService.changeReportLockStatus(
        '4492feff-99d7-4b2b-8896-12a59a75d4e1',
        'username1',
        false,
      );
      expect(report.is_unlocked).toBeFalsy();
      expect(report.idir_modified_date).toBe(report.report_unlock_date);
      expect(report.idir_modified_username).toBe('username1');
    });
  });
});
