import {
  convert,
  LocalDateTime,
  ZonedDateTime,
  ZoneId,
  ZoneOffset,
} from '@js-joda/core';
import createPrismaMock from 'prisma-mock';
import {
  adminReportService,
  adminReportServicePrivate,
} from './admin-report-service';
import { reportService } from './report-service';

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
        update_date: '2024-04-19T21:46:53.876',
        naics_code: '30',
        report_status: 'Published',
        reporting_year: 2024,
        is_unlocked: true,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
        company_id: company1.company_id,
        admin_last_access_date: '2024-04-21T11:40:00.000',
      },
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        update_date: '2023-04-19T21:46:53.876',
        naics_code: '11',
        report_status: 'Published',
        reporting_year: 2023,
        is_unlocked: false,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e9',
        company_id: company2.company_id,
        admin_last_access_date: null,
      },
      {
        report_id: '4492feff-99d7-4b2b-8896-12a59a75d4e3',
        update_date: '2022-04-19T21:46:53.876',
        naics_code: '40',
        report_status: 'Published',
        reporting_year: 2021,
        is_unlocked: false,
        employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e5',
        company_id: company2.company_id,
        admin_last_access_date: null,
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
        admin_last_access_date: null,
      },
    ];
    companies = [company2, company1];
    admins = [
      {
        admin_user_id: '1234',
        idir_user_guid: '5678',
      },
    ];

    prismaClient = createPrismaMock({
      pay_transparency_report: reports,
      pay_transparency_company: companies,
      admin_user: admins,
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
              expect(response.reports).toHaveLength(0);
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
                expect(response.reports).toHaveLength(0);
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

        describe('admin_last_access_date', () => {
          describe('not', () => {
            describe('null', () => {
              it('should returns only reports with a non-null admin_last_access_date', async () => {
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

        describe('update_date / submission date', () => {
          it('should return reports with update_date between the specified dates', async () => {
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
              'key must be one of the following values: update_date, naics_code, reporting_year, is_unlocked, employee_count_range_id',
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
                '[{"key": "update_date", "operation": "eq", "value": ["2024-04-19 21:46:53.876", "2024-04-19 21:46:53.876"]}]',
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
                '[{"key": "update_date", "value": []}]',
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
  /*
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
        expect(result['Submission date']).toBe(mockReport.update_date);
        expect(result['Company name']).toBe(
          mockReport.pay_transparency_company.company_name,
        );
        expect(result['Reporting year']).toBe(mockReport.reporting_year);
        expect(result['NAICS code']).toBe(mockReport.naics_code);
        expect(result['Employee count']).toBe(
          mockReport.employee_count_range.employee_count_range,
        );
        expect(result['Is unlocked?']).toBe(
          mockReport.is_unlocked ? 'Yes' : 'No',
        );
        expect(Object.keys(result).length).toBe(6);
      });
    });
  });
  */

  describe('changeReportLockStatus', () => {
    it('should throw error if report does not exist', async () => {
      await expect(
        adminReportService.changeReportLockStatus(
          '5492feff-99d7-4b2b-8896-12a59a75d4e2',
          '5678',
          true,
        ),
      ).rejects.toThrow();
    });

    it('should change report is_unlocked to true', async () => {
      const report = await adminReportService.changeReportLockStatus(
        '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        '5678',
        true,
      );
      expect(report.is_unlocked).toBeTruthy();
      expect(report.admin_modified_date).toBe(report.report_unlock_date);
      expect(report.admin_user_id).toBe('1234');
    });
    it('should change report is_unlocked to false', async () => {
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
      const updateSpy = jest.spyOn(
        prismaClient.pay_transparency_report,
        'update',
      );
      await adminReportService.changeReportLockStatus(
        '4492feff-99d7-4b2b-8896-12a59a75d4e2',
        '5678',
        false,
      );

      const updateParam: any = updateSpy.mock.calls[0][0];
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
    it('should return the reports metrics', async () => {
      // Arrange
      const reportingYear = 2021;
      const result = await adminReportService.getReportsMetrics({
        reportingYear,
      });

      // Assert
      expect(result).toEqual({
        report_metrics: [
          {
            reporting_year: reportingYear,
            num_published_reports: 1,
          },
        ],
      });
    });
  });

  describe('updateAdminLastAccessDate', () => {
    it('executes an update statement against the pay_transparency_report table', async () => {
      const reportId = '4492feff-99d7-4b2b-8896-12a59a75d4e1';
      const updateSpy = jest.spyOn(
        prismaClient.pay_transparency_report,
        'update',
      );

      await adminReportServicePrivate.updateAdminLastAccessDate(reportId);

      expect(updateSpy).toHaveBeenCalledTimes(1);
      const updateParam: any = updateSpy.mock.calls[0][0];
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
});
