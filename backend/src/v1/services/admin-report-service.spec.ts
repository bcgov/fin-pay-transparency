import {
  convert,
  LocalDateTime,
  ZonedDateTime,
  ZoneId,
  ZoneOffset,
} from '@js-joda/core';
import prisma from '../prisma/prisma-client.js';
import {
  adminReportService,
  adminReportServicePrivate,
} from './admin-report-service.js';
import { reportService } from './report-service.js';
import { UserInputError } from '../types/errors.js';
import { Decimal } from '@prisma/client/runtime/library';

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
let admins = [];

jest.mock('./report-service');

const mockFindMany = jest.fn();
const mockFindUniqueReport = jest.fn();
const mockFindUniqueOrThrowReport = jest.fn();
const mockUpdateReport = jest.fn();
const mockCountReport = jest.fn();
const mockAdminUserFindFirst = jest.fn();
const mockFindManyReportHistory = jest.fn();

jest.mock('../prisma/prisma-client-readonly-replica', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client-readonly-replica'),
  default: {
    pay_transparency_report: {
      findMany: (args) => mockFindMany(args),
      findUniqueOrThrow: (args) => mockFindUniqueOrThrowReport(args),
      findUnique: (args) => mockFindUniqueReport(args),
      count: (args) => mockCountReport(args),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
  },
}));

jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client'),
  default: {
    pay_transparency_report: {
      findUniqueOrThrow: (args) => mockFindUniqueOrThrowReport(args),
      findUnique: (args) => mockFindUniqueReport(args),
      update: (args) => mockUpdateReport(args),
      fields: {
        update_date: '',
      },
    },
    admin_user: {
      findFirst: (args) => mockAdminUserFindFirst(args),
    },
    report_history: {
      findMany: (args) => mockFindManyReportHistory(args),
      fields: {
        update_date: '',
      },
    },
    $extends: jest.fn(),
    $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
  },
}));

describe('admin-report-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reports = [
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
        create_date: '2024-04-19T21:46:53.876',
        update_date: '2024-04-19T21:46:53.876',
        naics_code: '30',
        report_status: 'Published',
        reporting_year: 2024,
        revision: new Decimal(1),
        is_unlocked: true,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
        company_id: company1.company_id,
        admin_last_access_date: '2024-04-21T11:40:00.000',
        admin_modified_reason: 'YEAR',
        pay_transparency_company: company1,
      },
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        create_date: '2023-04-06T20:14:12.572',
        update_date: '2023-04-19T21:46:53.876',
        naics_code: '11',
        report_status: 'Published',
        reporting_year: 2023,
        revision: new Decimal(1),
        is_unlocked: false,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e9',
        company_id: company2.company_id,
        admin_last_access_date: null,
        admin_modified_reason: 'YEAR',
        pay_transparency_company: company2,
      },
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
        create_date: '2023-04-05T19:22:54.743',
        update_date: '2022-04-19T21:46:53.876',
        naics_code: '40',
        report_status: 'Published',
        reporting_year: 2021,
        revision: new Decimal(1),
        is_unlocked: false,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e5',
        company_id: company2.company_id,
        admin_last_access_date: null,
        admin_modified_reason: 'YEAR',
        pay_transparency_company: company2,
      },
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d499',
        create_date: '2022-04-19T21:46:53.876',
        update_date: '2024-04-19T21:46:53.876',
        naics_code: '40',
        report_status: 'Draft',
        reporting_year: 2021,
        revision: new Decimal(1),
        is_unlocked: false,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e5',
        company_id: company2.company_id,
        admin_last_access_date: null,
        admin_modified_reason: 'YEAR',
        pay_transparency_company: company2,
      },
    ];
    companies = [company2, company1];
    admins = [
      {
        admin_user_id: '1234',
        idir_user_guid: '5678',
      },
    ];
  });

  describe('searchReports', () => {
    it('should return unsorted and unfiltered reports', async () => {
      const publishedReports = reports.filter(
        (r) => r.report_status === 'Published',
      );
      mockFindMany.mockResolvedValue(publishedReports);
      mockCountReport.mockResolvedValue(publishedReports.length);

      const response = await adminReportService.searchReport(0, 10, '[]', '[]');
      expect(response.total).toBe(3);
    });

    it('should throw error if query params cannot be parsed', async () => {
      try {
        await adminReportService.searchReport(0, 10, '', '');
      } catch (error) {
        expect(error.message).toBe('Invalid query parameters');
      }
    });

    describe('pagination', () => {
      describe('if limit is negative', () => {
        it('should throw an error', async () => {
          await expect(
            adminReportService.searchReport(0, -1, '[]', '[]'),
          ).rejects.toThrow();
        });
      });
      describe('if limit is undefined', () => {
        it('should throw an error', async () => {
          const response = await adminReportService.searchReport(
            0,
            undefined,
            '[]',
            '[]',
          );
          await expect(response.limit).toBeUndefined();
        });
      });
    });

    describe('filtering', () => {
      describe('when there are dates in the filter', () => {
        it('dates in the filters are converted to UTC', async () => {
          await adminReportService.searchReport(
            0,
            10,
            '[]',
            '[{"key": "create_date", "operation": "between", "value": ["2024-10-02T00:00:00-07:00", "2024-10-02T23:59:59-07:00"] }]',
          );
          const { where } = mockFindMany.mock.calls[0][0];
          expect(where.create_date).toEqual({
            gte: '2024-10-02T07:00:00Z',
            lt: '2024-10-03T06:59:59Z',
          });
        });
      });
      describe('when filter is valid', () => {
        describe('reporting year', () => {
          it('eq', async () => {
            const filtered = reports.filter(
              (r) =>
                r.report_status === 'Published' && r.reporting_year === 2024,
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

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
            const filtered = reports.filter(
              (r) =>
                r.report_status === 'Published' && r.reporting_year !== 2024,
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

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
            const filtered = reports.filter(
              (r) => r.report_status === 'Published' && r.reporting_year < 2024,
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

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
            const filtered = reports.filter(
              (r) =>
                r.report_status === 'Published' && r.reporting_year <= 2024,
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

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
            const filtered = reports.filter(
              (r) => r.report_status === 'Published' && r.reporting_year > 2024,
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

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
            const filtered = reports.filter(
              (r) =>
                r.report_status === 'Published' && r.reporting_year >= 2024,
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

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
              const filtered = reports.filter(
                (r) => r.report_status === 'Published' && r.naics_code === '11',
              );
              mockFindMany.mockResolvedValue(filtered);
              mockCountReport.mockResolvedValue(filtered.length);

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
              mockFindMany.mockResolvedValue([]);
              mockCountReport.mockResolvedValue(0);

              const response = await adminReportService.searchReport(
                0,
                10,
                '[]',
                '[{"key": "naics_code", "operation": "in", "value": [] }]',
              );
              expect(response.reports).toHaveLength(0);
            });
          });
        });
        describe('employee_count_range', () => {
          describe('in', () => {
            describe('with a non empty array', () => {
              it('should return reports with count range matching the specified values', async () => {
                const filtered = reports.filter(
                  (r) =>
                    r.report_status === 'Published' &&
                    r.employee_count_range_id ===
                      '4492feff-99d7-4b2b-8896-12a59a75d4e1',
                );
                mockFindMany.mockResolvedValue(filtered);
                mockCountReport.mockResolvedValue(filtered.length);

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
                mockFindMany.mockResolvedValue([]);
                mockCountReport.mockResolvedValue(0);

                const response = await adminReportService.searchReport(
                  0,
                  10,
                  '[]',
                  '[{"key": "employee_count_range_id", "operation": "in", "value": [] }]',
                );
                expect(response.reports).toHaveLength(0);
              });
            });
          });
          describe('notin', () => {
            it('should return reports with count range matching the specified values', async () => {
              const filtered = reports.filter(
                (r) =>
                  r.report_status === 'Published' &&
                  r.employee_count_range_id !==
                    '4492feff-99d7-4b2b-8896-12a59a75d4e1',
              );
              mockFindMany.mockResolvedValue(filtered);
              mockCountReport.mockResolvedValue(filtered.length);

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

        describe('admin_last_access_date', () => {
          describe('not', () => {
            describe('null', () => {
              it('should returns only reports with a non-null admin_last_access_date', async () => {
                const filtered = reports.filter(
                  (r) =>
                    r.report_status === 'Published' &&
                    r.admin_last_access_date !== null,
                );
                mockFindMany.mockResolvedValue(filtered);
                mockCountReport.mockResolvedValue(filtered.length);

                const response = await adminReportService.searchReport(
                  0,
                  10,
                  '[]',
                  '[{"key": "admin_last_access_date", "operation": "not", "value": null }]',
                );
                expect(response.reports).toHaveLength(1);
              });
            });
          });
        });

        describe("create_date (aka 'submission date')", () => {
          it('should return reports with create_date between the specified dates', async () => {
            const filtered = reports.filter((r) => {
              if (r.report_status !== 'Published') return false;
              const createDate = LocalDateTime.parse(
                r.create_date,
              ).toEpochSecond(ZoneOffset.UTC);
              const rangeStart = LocalDateTime.parse(
                '2024-01-01T21:46:53.876',
              ).toEpochSecond(ZoneOffset.UTC);
              const rangeEnd = LocalDateTime.parse(
                '2024-05-05T21:46:53.876',
              ).toEpochSecond(ZoneOffset.UTC);
              return createDate >= rangeStart && createDate < rangeEnd;
            });
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

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

          it('should all reports if values not provided to create_date', async () => {
            const filtered = reports.filter(
              (r) => r.report_status === 'Published',
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "create_date", "operation": "between", "value": [] }]',
            );
            expect(response.reports).toHaveLength(3);
          });
        });
        describe('update_date', () => {
          it('should return reports with update_date between the specified dates', async () => {
            const filtered = reports.filter((r) => {
              if (r.report_status !== 'Published') return false;
              const updateDate = LocalDateTime.parse(
                r.update_date,
              ).toEpochSecond(ZoneOffset.UTC);
              const rangeStart = LocalDateTime.parse(
                '2024-01-01T21:46:53.876',
              ).toEpochSecond(ZoneOffset.UTC);
              const rangeEnd = LocalDateTime.parse(
                '2024-05-05T21:46:53.876',
              ).toEpochSecond(ZoneOffset.UTC);
              return updateDate >= rangeStart && updateDate < rangeEnd;
            });
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "update_date", "operation": "between", "value": ["2024-01-01T21:46:53.876", "2024-05-05T21:46:53.876"] }]',
            );
            expect(
              response.reports.every((x) => {
                const updateDate = LocalDateTime.parse(
                  x.update_date,
                ).toEpochSecond(ZoneOffset.UTC);
                const rangeStart = LocalDateTime.parse(
                  '2024-01-01T21:46:53.876',
                ).toEpochSecond(ZoneOffset.UTC);
                const rangeEnd = LocalDateTime.parse(
                  '2024-05-05T21:46:53.876',
                ).toEpochSecond(ZoneOffset.UTC);
                return updateDate >= rangeStart && updateDate < rangeEnd;
              }),
            ).toBeTruthy();
          });

          it('should all reports if values not provided to update_date', async () => {
            const filtered = reports.filter(
              (r) => r.report_status === 'Published',
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "update_date", "operation": "between", "value": [] }]',
            );
            expect(response.reports).toHaveLength(3);
          });
        });
        describe('is_unlocked', () => {
          it('should return all unlocked reports', async () => {
            const filtered = reports.filter(
              (r) => r.report_status === 'Published' && r.is_unlocked,
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "is_unlocked", "operation": "eq", "value": true }]',
            );
            expect(response.reports.every((x) => x.is_unlocked)).toBeTruthy();
          });

          it('should return locked reports', async () => {
            const filtered = reports.filter(
              (r) => r.report_status === 'Published' && !r.is_unlocked,
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "is_unlocked", "operation": "eq", "value": false }]',
            );
            expect(response.reports.every((x) => !x.is_unlocked)).toBeTruthy();
          });
        });
        describe('admin_modified_reason', () => {
          it('should return all reports with a specific admin_modified_reason', async () => {
            const filtered = reports.filter(
              (r) =>
                r.report_status === 'Published' &&
                r.admin_modified_reason === 'YEAR',
            );
            mockFindMany.mockResolvedValue(filtered);
            mockCountReport.mockResolvedValue(filtered.length);

            const response = await adminReportService.searchReport(
              0,
              10,
              '[]',
              '[{"key": "admin_modified_reason", "operation": "eq", "value": "YEAR" }]',
            );
            expect(
              response.reports.every((x) => x.admin_modified_reason),
            ).toBeTruthy();
          });
        });

        describe('relations', () => {
          describe('company_name', () => {
            it('should filter by company name', async () => {
              const filtered = reports.filter(
                (r) =>
                  r.report_status === 'Published' &&
                  r.pay_transparency_company.company_name
                    .toLowerCase()
                    .includes('company name 1'),
              );
              mockFindMany.mockResolvedValue(filtered);
              mockCountReport.mockResolvedValue(filtered.length);

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
          await expect(
            adminReportService.searchReport(
              0,
              101,
              '[]',
              '[{"key": "invalid", "operation": "eq", "value": 1}]',
            ),
          ).rejects.toThrow(
            'key must be one of the following values: create_date, update_date, naics_code, reporting_year, is_unlocked, report_status, employee_count_range_id',
          );
        });
        it('should fail if operation is invalid for the specified key', async () => {
          await expect(
            adminReportService.searchReport(
              0,
              101,
              '[]',
              '[{"key": "create_date", "operation": "eq", "value": ["2024-04-19 21:46:53.876", "2024-04-19 21:46:53.876"]}]',
            ),
          ).rejects.toThrow('Missing or invalid operation');
        });
        it('should fail if operation is missing', async () => {
          await expect(
            adminReportService.searchReport(
              0,
              101,
              '[]',
              '[{"key": "update_date", "value": []}]',
            ),
          ).rejects.toThrow('Missing operation');
        });

        it('should fail if filter value is invalid for the specified key', async () => {
          await expect(
            adminReportService.searchReport(
              0,
              101,
              '[]',
              '[{"key": "is_unlocked", "operation": "eq", "value": []}]',
            ),
          ).rejects.toThrow('Invalid or missing filter value');
        });
      });
    });

    describe('sorting', () => {
      describe('reporting year', () => {
        it('asc', async () => {
          const sorted = [
            ...reports.filter((r) => r.report_status === 'Published'),
          ].sort((a, b) => a.reporting_year - b.reporting_year);
          mockFindMany.mockResolvedValue(sorted);
          mockCountReport.mockResolvedValue(sorted.length);

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
          const sorted = [
            ...reports.filter((r) => r.report_status === 'Published'),
          ].sort((a, b) => b.reporting_year - a.reporting_year);
          mockFindMany.mockResolvedValue(sorted);
          mockCountReport.mockResolvedValue(sorted.length);

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
            const sorted = [
              ...reports.filter((r) => r.report_status === 'Published'),
            ].sort((a, b) =>
              a.pay_transparency_company.company_name.localeCompare(
                b.pay_transparency_company.company_name,
              ),
            );
            mockFindMany.mockResolvedValue(sorted);
            mockCountReport.mockResolvedValue(sorted.length);

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

  describe('toHumanFriendlyReport', () => {
    describe('given a report of the form returned by searchReport', () => {
      it('returns a flattened and simplified report', () => {
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

        const result = adminReportService.toHumanFriendlyReport(mockReport);
        expect(result['Submission Date']).toBe(mockReport.create_date);
        expect(result['Employer Name']).toBe(
          mockReport.pay_transparency_company.company_name,
        );
        expect(result['Reporting Year']).toBe(mockReport.reporting_year);
        expect(result['NAICS Code']).toBe(mockReport.naics_code);
        expect(result['Employee Count']).toBe(
          mockReport.employee_count_range.employee_count_range,
        );
        expect(result['Is Unlocked']).toBe(
          mockReport.is_unlocked ? 'Yes' : 'No',
        );
        expect(Object.keys(result)).toHaveLength(6);
      });
    });
  });

  describe('changeReportLockStatus', () => {
    it('should throw error if report does not exist', async () => {
      mockFindUniqueOrThrowReport.mockRejectedValue(
        new Error('Report not found'),
      );

      await expect(
        adminReportService.changeReportLockStatus(
          '5492feff-99d7-4b2b-8896-12a59a75d4e2',
          '5678',
          true,
        ),
      ).rejects.toThrow();
    });

    it('should change report is_unlocked to true', async () => {
      const reportToUnlock = reports.find(
        (r) => r.report_id === '4492feff-99d7-4b2b-8896-12a59a75d4e2',
      );
      mockFindUniqueOrThrowReport.mockResolvedValue(reportToUnlock);
      mockAdminUserFindFirst.mockResolvedValue(admins[0]);

      const updatedReport = {
        ...reportToUnlock,
        is_unlocked: true,
        admin_user_id: '1234',
        report_unlock_date: new Date(),
        admin_modified_date: new Date(),
      };
      mockUpdateReport.mockResolvedValue(updatedReport);

      const report = await adminReportService.changeReportLockStatus(
        '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        '5678',
        true,
      );
      expect(report.is_unlocked).toBeTruthy();
      expect(report.admin_modified_date).toBe(report.report_unlock_date);
      expect(report.admin_user_id).toBe('1234');
      expect(reportService.copyPublishedReportToHistory).toHaveBeenCalled();
    });

    it('should change report is_unlocked to false', async () => {
      const reportToLock = reports.find(
        (r) => r.report_id === '4492feff-99d7-4b2b-8896-12a59a75d4e1',
      );
      mockFindUniqueOrThrowReport.mockResolvedValue(reportToLock);
      mockAdminUserFindFirst.mockResolvedValue(admins[0]);

      const updatedReport = {
        ...reportToLock,
        is_unlocked: false,
        admin_user_id: '1234',
        report_unlock_date: new Date(),
        admin_modified_date: new Date(),
      };
      mockUpdateReport.mockResolvedValue(updatedReport);

      const report = await adminReportService.changeReportLockStatus(
        '4492feff-99d7-4b2b-8896-12a59a75d4e1',
        '5678',
        false,
      );
      expect(report.is_unlocked).toBeFalsy();
      expect(report.admin_modified_date).toBe(report.report_unlock_date);
      expect(report.admin_user_id).toBe('1234');
    });

    it('should update the report_unlock_date to the current date/time in UTC', async () => {
      const reportToLock = reports.find(
        (r) => r.report_id === '4492feff-99d7-4b2b-8896-12a59a75d4e2',
      );
      mockFindUniqueOrThrowReport.mockResolvedValue(reportToLock);
      mockAdminUserFindFirst.mockResolvedValue(admins[0]);

      const updatedReport = {
        ...reportToLock,
        is_unlocked: false,
        admin_user_id: '1234',
        report_unlock_date: new Date(),
        admin_modified_date: new Date(),
      };
      mockUpdateReport.mockResolvedValue(updatedReport);

      await adminReportService.changeReportLockStatus(
        '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        '5678',
        false,
      );

      const updateParam: any = mockUpdateReport.mock.calls[0][0];
      expect(updateParam.data.admin_modified_date).toBe(
        updateParam.data.report_unlock_date,
      );

      //check that the unlock report date/time submitted to the database is approximately
      //equal to the current UTC date/time
      const currentDateUtc = convert(ZonedDateTime.now(ZoneId.UTC)).toDate();
      const unlockDateDiffMs =
        currentDateUtc.getTime() -
        updateParam.data.report_unlock_date.getTime();
      expect(unlockDateDiffMs).toBeGreaterThanOrEqual(0);
      expect(unlockDateDiffMs).toBeLessThan(10000); //10 seconds
    });
  });

  describe('updateReportReportingYear', () => {
    it('should throw error if report does not exist', async () => {
      mockFindUniqueOrThrowReport.mockRejectedValue(
        new Error('Report not found'),
      );

      await expect(
        adminReportService.updateReportReportingYear(
          '5492feff-99d7-4b2b-8896-12a59a75d4e2',
          '5678',
          2025,
        ),
      ).rejects.toThrow();
    });

    it('should change the reporting year', async () => {
      const reportToUpdate = reports.find(
        (r) => r.report_id === '4492feff-99d7-4b2b-8896-12a59a75d4e2',
      );
      mockFindUniqueOrThrowReport.mockResolvedValue(reportToUpdate);
      mockAdminUserFindFirst.mockResolvedValue(admins[0]);
      mockFindMany.mockResolvedValue([]); // No existing report for 2025

      const updatedReport = {
        ...reportToUpdate,
        reporting_year: 2025,
        admin_user_id: '1234',
        admin_modified_date: new Date(),
      };
      mockUpdateReport.mockResolvedValue(updatedReport);

      const report = await adminReportService.updateReportReportingYear(
        '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        '5678',
        2025,
      );
      expect(report.reporting_year).toBe(2025);
      expect(report.admin_modified_date.toISOString()).toMatch(
        new Date().toISOString().slice(0, 18),
      );
      expect(report.admin_user_id).toBe('1234');
      expect(reportService.copyPublishedReportToHistory).toHaveBeenCalled();
    });

    it('should throw error if the selected reporting year is the same as the current reporting year', async () => {
      const reportToUpdate = reports.find(
        (r) => r.report_id === '4492feff-99d7-4b2b-8896-12a59a75d4e2',
      );
      mockFindUniqueOrThrowReport.mockResolvedValue(reportToUpdate);
      mockAdminUserFindFirst.mockResolvedValue(admins[0]);

      await expect(
        adminReportService.updateReportReportingYear(
          '4492feff-99d7-4b2b-8896-12a59a75d4e2',
          '5678',
          2023,
        ),
      ).rejects.toThrow(
        new UserInputError('The report is already set to the year 2023.'),
      );
    });

    it('Should throw error if a report for the selected year already exists for this company', async () => {
      const reportToUpdate = reports.find(
        (r) => r.report_id === '4492feff-99d7-4b2b-8896-12a59a75d4e2',
      );
      mockFindUniqueOrThrowReport.mockResolvedValue(reportToUpdate);
      mockAdminUserFindFirst.mockResolvedValue(admins[0]);

      // Return an existing report for 2021 for the same company
      const existingReport = reports.find(
        (r) =>
          r.reporting_year === 2021 && r.company_id === company2.company_id,
      );
      mockFindMany.mockResolvedValue([existingReport]);

      await expect(
        adminReportService.updateReportReportingYear(
          '4492feff-99d7-4b2b-8896-12a59a75d4e2',
          '5678',
          2021,
        ),
      ).rejects.toThrow(
        new UserInputError(
          'A report for the year 2021 already exists for this company.',
        ),
      );
    });
  });

  describe('getReportPdf', () => {
    it("updates the report's last admin access date", async () => {
      const mockReq = {};
      const reportId = '4492feff-99d7-4b2b-8896-12a59a75d4e1';
      const mockReport = Buffer.from('mock pdf report');
      jest.spyOn(reportService, 'getReportPdf').mockResolvedValue(mockReport);
      const updateAdminLastAccessDateSpy = jest.spyOn(
        adminReportServicePrivate,
        'updateAdminLastAccessDate',
      );
      const report = await adminReportService.getReportPdf(mockReq, reportId);
      expect(report).toEqual(mockReport);
      expect(updateAdminLastAccessDateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReportMetrics', () => {
    it('should return separate counts for year-specific and all-time published reports', async () => {
      // Arrange
      const reportingYear = 2024;

      // Mock for year-specific count
      mockCountReport.mockResolvedValueOnce(1); // Only 2024
      // Mock for all-time count
      mockCountReport.mockResolvedValueOnce(3); // All years

      const result = await adminReportService.getReportsMetrics({
        reportingYear,
      });

      // Assert
      const metrics = result.report_metrics[0];
      expect(metrics.num_published_reports).toBe(1); // Only 2024
      expect(metrics.num_published_reports_total).toBe(3); // All years
      expect(metrics.num_published_reports_total).toBeGreaterThanOrEqual(
        metrics.num_published_reports,
      );
    });
  });

  describe('updateAdminLastAccessDate', () => {
    it('executes an update statement against the pay_transparency_report table', async () => {
      const reportId = '4492feff-99d7-4b2b-8896-12a59a75d4e1';
      const reportToUpdate = reports.find((r) => r.report_id === reportId);

      const updatedReport = {
        ...reportToUpdate,
        admin_last_access_date: new Date(),
      };
      mockUpdateReport.mockResolvedValue(updatedReport);

      await adminReportServicePrivate.updateAdminLastAccessDate(reportId);

      expect(mockUpdateReport).toHaveBeenCalledTimes(1);
      const updateParam: any = mockUpdateReport.mock.calls[0][0];
      expect(updateParam.where.report_id).toBe(reportId);
      expect(Object.keys(updateParam.data)).toHaveLength(1);

      //check that the date/time submitted to the database is approximately equal
      //to the current UTC date/time
      const currentDateUtc = convert(ZonedDateTime.now(ZoneId.UTC)).toDate();
      const dateDiffMs =
        currentDateUtc.getTime() -
        updateParam.data.admin_last_access_date.getTime();
      expect(dateDiffMs).toBeGreaterThanOrEqual(0);
      expect(dateDiffMs).toBeLessThan(10000); //10 seconds
    });
  });

  describe('getReportAdminActionHistory', () => {
    describe('when there are no history records for the given report', () => {
      it('returns an empty list when report has no admin actions in history', async () => {
        const mockReportId = '4492feff-99d7-4b2b-8896-12a59a75d4e1';
        const mockReport = {
          report_id: mockReportId,
          update_date: new Date('2024-01-15T10:00:00Z'),
          admin_modified_date: new Date('2024-01-10T10:00:00Z'), // admin_modified_date < update_date
          is_unlocked: true,
          report_status: 'Published',
          admin_user: { admin_user_id: '1234', display_name: 'Admin User' },
        };

        mockFindUniqueReport.mockResolvedValue(mockReport);
        mockFindManyReportHistory.mockResolvedValue([]);

        const reportAdminActionHistory =
          await adminReportService.getReportAdminActionHistory(mockReportId);
        expect(reportAdminActionHistory).toStrictEqual([]);
      });
    });

    describe('when there are admin action history records', () => {
      it('returns current state if it was an admin action', async () => {
        const mockReportId = '4492feff-99d7-4b2b-8896-12a59a75d4e1';
        const mockReport = {
          report_id: mockReportId,
          update_date: new Date('2024-01-10T10:00:00Z'),
          admin_modified_date: new Date('2024-01-15T10:00:00Z'), // admin_modified_date > update_date
          admin_modified_reason: 'LOCK',
          is_unlocked: false,
          report_status: 'Published',
          admin_user: { admin_user_id: '1234', display_name: 'Admin User' },
        };

        mockFindUniqueReport.mockResolvedValue(mockReport);
        mockFindManyReportHistory.mockResolvedValue([]);

        const reportAdminActionHistory =
          await adminReportService.getReportAdminActionHistory(mockReportId);

        expect(reportAdminActionHistory).toHaveLength(1);
        expect(reportAdminActionHistory[0]).toEqual({
          report_history_id: null,
          action: 'LOCK',
          admin_modified_date: mockReport.admin_modified_date,
          admin_user_display_name: 'Admin User',
        });
      });

      it('returns lock/unlock action history correctly', async () => {
        const mockReportId = '4492feff-99d7-4b2b-8896-12a59a75d4e1';
        const mockReport = {
          report_id: mockReportId,
          update_date: new Date('2024-01-01T10:00:00Z'),
          admin_modified_date: new Date('2024-01-20T10:00:00Z'),
          admin_modified_reason: 'LOCK',
          is_unlocked: false,
          report_status: 'Published',
          admin_user: { admin_user_id: '1234', display_name: 'Current Admin' },
        };

        const mockHistoryRecords = [
          {
            report_history_id: 'hist-1',
            update_date: new Date('2024-01-01T10:00:00Z'),
            admin_modified_date: new Date('2024-01-15T10:00:00Z'),
            admin_modified_reason: 'UNLOCK',
            is_unlocked: true,
            report_status: 'Published',
            admin_user: {
              admin_user_id: '1234',
              display_name: 'History Admin 1',
            },
          },
          {
            report_history_id: 'hist-2',
            update_date: new Date('2024-01-01T10:00:00Z'),
            admin_modified_date: new Date('2024-01-10T10:00:00Z'),
            admin_modified_reason: 'LOCK',
            is_unlocked: false,
            report_status: 'Published',
            admin_user: {
              admin_user_id: '1234',
              display_name: 'History Admin 2',
            },
          },
        ];

        mockFindUniqueReport.mockResolvedValue(mockReport);
        mockFindManyReportHistory.mockResolvedValue(mockHistoryRecords);

        const reportAdminActionHistory =
          await adminReportService.getReportAdminActionHistory(mockReportId);

        expect(reportAdminActionHistory).toHaveLength(3);

        // Current state (most recent)
        expect(reportAdminActionHistory[0]).toEqual({
          report_history_id: null,
          action: 'LOCK',
          admin_modified_date: mockReport.admin_modified_date,
          admin_user_display_name: 'Current Admin',
        });

        // First history record
        expect(reportAdminActionHistory[1]).toEqual({
          report_history_id: 'hist-1',
          action: 'UNLOCK',
          admin_modified_date: mockHistoryRecords[0].admin_modified_date,
          admin_user_display_name: 'History Admin 1',
        });

        // Second history record
        expect(reportAdminActionHistory[2]).toEqual({
          report_history_id: 'hist-2',
          action: 'LOCK',
          admin_modified_date: mockHistoryRecords[1].admin_modified_date,
          admin_user_display_name: 'History Admin 2',
        });
      });

      it('returns withdraw action history correctly', async () => {
        const mockReportId = '4492feff-99d7-4b2b-8896-12a59a75d4e1';
        const mockReport = {
          report_id: mockReportId,
          update_date: new Date('2024-01-20T10:00:00Z'),
          admin_modified_date: new Date('2024-01-15T10:00:00Z'),
          is_unlocked: true,
          report_status: 'Published',
          admin_user: { admin_user_id: '1234', display_name: 'Current Admin' },
        };

        const mockHistoryRecords = [
          {
            report_history_id: 'hist-1',
            update_date: new Date('2024-01-01T10:00:00Z'),
            admin_modified_date: new Date('2024-01-15T10:00:00Z'),
            admin_modified_reason: 'WITHDRAW',
            is_unlocked: true,
            report_status: 'Withdrawn',
            admin_user: {
              admin_user_id: '1234',
              display_name: 'History Admin 1',
            },
          },
        ];

        mockFindUniqueReport.mockResolvedValue(mockReport);
        mockFindManyReportHistory.mockResolvedValue(mockHistoryRecords);

        const reportAdminActionHistory =
          await adminReportService.getReportAdminActionHistory(mockReportId);

        expect(reportAdminActionHistory).toHaveLength(1);

        // History record - withdrawal
        expect(reportAdminActionHistory[0]).toEqual({
          report_history_id: 'hist-1',
          action: 'WITHDRAW',
          admin_modified_date: mockHistoryRecords[0].admin_modified_date,
          admin_user_display_name: 'History Admin 1',
        });
      });
    });

    describe("when the given reportId doesn't correspond to a report", () => {
      it('throws a UserInputError', async () => {
        const mockReportId = 'unknown-report-id';
        mockFindUniqueReport.mockResolvedValue(null);

        await expect(
          adminReportService.getReportAdminActionHistory(mockReportId),
        ).rejects.toThrow('Not found');
      });
    });
  });

  describe('withdrawReport', () => {
    describe('when withdrawing a published report', () => {
      it('should successfully withdraw the report and create history', async () => {
        const reportId = 'test-report-id';
        const idirGuid = 'test-idir-guid';
        const adminUserId = 'test-admin-id';

        const mockAdminUser = {
          admin_user_id: adminUserId,
          idir_user_guid: idirGuid,
          display_name: 'Test Admin',
        };

        const mockPublishedReport = {
          report_id: reportId,
          report_status: 'Published',
          pay_transparency_calculated_data: [],
        };

        const mockWithdrawnReport = {
          report_id: reportId,
          report_status: 'Withdrawn',
          admin_user_id: adminUserId,
          admin_modified_date: new Date(),
        };

        mockAdminUserFindFirst.mockResolvedValue(mockAdminUser);
        jest
          .spyOn(reportService, 'copyPublishedReportToHistory')
          .mockResolvedValue();

        // Mock transaction to override findUniqueOrThrow and update
        (prisma.$transaction as jest.Mock).mockImplementationOnce(
          async (callback) => {
            const mockTx = {
              pay_transparency_report: {
                findUniqueOrThrow: jest
                  .fn()
                  .mockResolvedValue(mockPublishedReport),
                update: jest.fn().mockResolvedValue(mockWithdrawnReport),
              },
            };
            return await callback(mockTx);
          },
        );

        const result = await adminReportService.withdrawReport(
          reportId,
          idirGuid,
        );

        expect(mockAdminUserFindFirst).toHaveBeenCalledWith({
          where: { idir_user_guid: idirGuid },
        });
        expect(reportService.copyPublishedReportToHistory).toHaveBeenCalled();
        expect(result).toEqual(mockWithdrawnReport);
      });
    });

    describe('when trying to withdraw with invalid admin user', () => {
      it('should throw UserInputError', async () => {
        const reportId = 'test-report-id';
        const idirGuid = 'invalid-idir-guid';

        mockAdminUserFindFirst.mockResolvedValue(null);

        await expect(
          adminReportService.withdrawReport(reportId, idirGuid),
        ).rejects.toThrow(UserInputError);
      });
    });

    describe('when trying to withdraw a non-existent report', () => {
      it('should throw an error', async () => {
        const reportId = 'non-existent-id';
        const idirGuid = 'test-idir-guid';
        const adminUserId = 'test-admin-id';

        const mockAdminUser = {
          admin_user_id: adminUserId,
          idir_user_guid: idirGuid,
          display_name: 'Test Admin',
        };

        mockAdminUserFindFirst.mockResolvedValue(mockAdminUser);

        (prisma.$transaction as jest.Mock).mockImplementationOnce(
          async (callback) => {
            const mockTx = {
              pay_transparency_report: {
                findUniqueOrThrow: jest
                  .fn()
                  .mockRejectedValue(
                    new Error(`Report with ID ${reportId} not found`),
                  ),
              },
            };
            return await callback(mockTx);
          },
        );

        await expect(
          adminReportService.withdrawReport(reportId, idirGuid),
        ).rejects.toThrow(`Report with ID ${reportId} not found`);
      });
    });

    describe('when trying to withdraw a draft report', () => {
      it('should throw an error', async () => {
        const reportId = 'draft-report-id';
        const idirGuid = 'test-idir-guid';
        const adminUserId = 'test-admin-id';

        const mockAdminUser = {
          admin_user_id: adminUserId,
          idir_user_guid: idirGuid,
          display_name: 'Test Admin',
        };

        const mockDraftReport = {
          report_id: reportId,
          report_status: 'Draft',
          pay_transparency_calculated_data: [],
        };

        mockAdminUserFindFirst.mockResolvedValue(mockAdminUser);

        (prisma.$transaction as jest.Mock).mockImplementationOnce(
          async (callback) => {
            const mockTx = {
              pay_transparency_report: {
                findUniqueOrThrow: jest.fn().mockResolvedValue(mockDraftReport),
              },
            };
            return await callback(mockTx);
          },
        );

        await expect(
          adminReportService.withdrawReport(reportId, idirGuid),
        ).rejects.toThrow('Only published reports can be withdrawn');
      });
    });
  });
});
