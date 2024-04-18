import {
  LocalDate,
  TemporalAdjusters,
  ZoneId,
  convert,
  nativeJs,
} from '@js-joda/core';
import type { pay_transparency_report, report_history } from '@prisma/client';
import { Prisma } from '@prisma/client';
import stream from 'stream';
import {
  DISPLAY_REPORT_DATE_FORMAT,
  JSON_REPORT_DATE_FORMAT,
} from '../../constants';
import prisma from '../prisma/prisma-client';
import { CALCULATION_CODES } from './report-calc-service';
import {
  CalcCodeGenderCode,
  GENDERS,
  GenderChartInfo,
  Report,
  ReportAndCalculations,
  enumReportStatus,
  reportService,
  reportServicePrivate,
} from './report-service';
import { utils } from './utils-service';

const actualMovePublishedReportToHistory =
  reportServicePrivate.movePublishedReportToHistory;

jest.mock('./utils-service');
const mockCompanyFindFirst = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportFindUnique = jest.fn();
jest.mock('../prisma/prisma-client', () => {
  return {
    pay_transparency_company: {
      findFirst: (...args) => mockCompanyFindFirst(...args),
      create: jest.fn(),
      update: jest.fn(),
    },
    pay_transparency_report: {
      findUnique: (...args) => mockReportFindUnique(...args),
      findFirst: (...args) => mockReportFindFirst(...args),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    report_history: {
      create: jest.fn(),
    },
    pay_transparency_calculated_data: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    calculated_data_history: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

const mockCompanyInDB = {
  company_id: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
  company_name: 'Test Company',
  address_line1: '123 Main St',
  address_line2: 'Suite 100',
  city: 'Victoria',
  province: 'BC',
  country: 'Canada',
  postal_code: 'V8V 4K9',
  create_date: new Date(),
  update_date: new Date(),
};
const mockUserInfo = {
  jwt: 'validJwt',
  _json: {
    bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
    bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
    display_name: 'Test User',
  },
};
const mockReportInDB = {
  report_id: '57005aff-117e-7678-cd51-31a3dd198778',
};
const mockCalculatedDatasInDB = [
  {
    calculated_data_id: '43dcf60a-9c33-3282-9bba-43c0e2227cc2',
    report_id: mockReportInDB.report_id,
    calculation_code_id: '9ffb4434-bc23-b98a-87c7-6cc3dd19a214',
    value: '100',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_1',
    },
  },
  {
    calculated_data_id: '53dcf60a-9c33-3282-9bba-43c0e2227321',
    report_id: mockReportInDB.report_id,
    calculation_code_id: '8ffb4434-bc23-b98a-87c7-5cc3dd19a210',
    value: '99',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_2',
    },
  },
  {
    calculated_data_id: '63dcf60a-9c33-3282-9bba-43c0e2227567',
    report_id: mockReportInDB.report_id,
    calculation_code_id: '7ffb4434-bc23-b98a-87c7-4cc3dd19a212',
    value: '98',
    is_suppressed: false,
    calculation_code: {
      calculation_code: 'MOCK_CALC_CODE_3',
    },
  },
];

const mockPublishedReportInDb: pay_transparency_report = {
  report_id: '456768',
  company_id: '255677',
  user_id: '1232344',
  user_comment: null,
  employee_count_range_id: '67856345',
  naics_code: '234234',
  report_start_date: convert(LocalDate.now(ZoneId.UTC)).toDate(),
  report_end_date: convert(LocalDate.now(ZoneId.UTC).plusYears(1)).toDate(),
  reporting_year: new Prisma.Decimal(2022),
  create_date: new Date(),
  update_date: new Date(),
  create_user: 'User',
  update_user: 'User',
  report_status: enumReportStatus.Published,
  revision: new Prisma.Decimal(1),
  data_constraints: null,
  is_unlocked: true,
  report_unlock_date: null,
};

const mockPublishedReportInApi: Report =
  reportServicePrivate.prismaReportToReport(mockPublishedReportInDb);

const mockHistoryReport: report_history = {
  report_history_id: '567',
  report_lock_date: new Date(),
  ...mockPublishedReportInDb,
};

const mockDraftReportInDb: pay_transparency_report = {
  ...mockPublishedReportInDb,
  report_id: '2489554',
  user_id: '5265928',
  report_status: enumReportStatus.Draft,
};

const mockDraftReportInApi: Report =
  reportServicePrivate.prismaReportToReport(mockDraftReportInDb);

describe('getReportAndCalculations', () => {
  describe('wwhere there is no user in the session', () => {
    it('throws an error', async () => {
      const mockReq = {};
      const mockReportId = null;
      (utils.getSessionUser as jest.Mock).mockReturnValue(null);

      await expect(
        reportService.getReportAndCalculations(mockReq, mockReportId),
      ).rejects.toThrow();
      expect(utils.getSessionUser).toHaveBeenCalledTimes(1);
    });
  });
  describe('when a valid report id is provided', () => {
    it('returns an object containing both the report and the values of its calculations', async () => {
      const mockReq = {};
      const mockReportId = mockReportInDB.report_id;
      (utils.getSessionUser as jest.Mock).mockReturnValue(mockUserInfo);
      mockCompanyFindFirst.mockResolvedValue(mockCompanyInDB);
      mockReportFindFirst.mockResolvedValue(mockReportInDB);
      (
        prisma.pay_transparency_calculated_data.findMany as jest.Mock
      ).mockResolvedValue(mockCalculatedDatasInDB);

      const reportAndCalculations: ReportAndCalculations =
        await reportService.getReportAndCalculations(mockReq, mockReportId);

      expect(mockCompanyFindFirst).toHaveBeenCalledTimes(1);
      expect(mockReportFindFirst).toHaveBeenCalledTimes(1);
      expect(
        prisma.pay_transparency_calculated_data.findMany,
      ).toHaveBeenCalledTimes(1);
      expect(reportAndCalculations.report).toEqual(mockReportInDB);
      expect(Object.keys(reportAndCalculations.calculations).length).toEqual(
        mockCalculatedDatasInDB.length,
      );
    });
  });
  describe("when the user isn't associated with a company", () => {
    it('throws an error', async () => {
      const mockReq = {};
      const mockReportId = 'invalid_report_id';
      (utils.getSessionUser as jest.Mock).mockReturnValue(mockUserInfo);
      mockCompanyFindFirst.mockResolvedValue(null);

      await expect(
        reportService.getReportAndCalculations(mockReq, mockReportId),
      ).rejects.toThrow();
      expect(mockCompanyFindFirst).toHaveBeenCalledTimes(1);
    });
  });
  describe('when an invalid report id is provided', () => {
    it('returns null', async () => {
      const mockReq = {};
      const mockReportId = 'invalid_report_id';
      (utils.getSessionUser as jest.Mock).mockReturnValue(mockUserInfo);
      mockCompanyFindFirst.mockResolvedValue(mockCompanyInDB);
      mockReportFindFirst.mockResolvedValue(null);

      const reportAndCalcs = await reportService.getReportAndCalculations(
        mockReq,
        mockReportId,
      );
      await expect(reportAndCalcs).toBeNull();
      expect(mockCompanyFindFirst).toHaveBeenCalledTimes(1);
      expect(mockReportFindFirst).toHaveBeenCalledTimes(1);
    });
  });
});

describe('getReportData', () => {
  describe('when a valid report id is provided', () => {
    it('returns an HTML string of the report', async () => {
      const startDate: Date = convert(
        LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()),
      ).toDate();
      const endDate: Date = convert(
        LocalDate.now().with(TemporalAdjusters.lastDayOfMonth()),
      ).toDate();
      const mockReq = {
        session: {
          correlationID: 'mockCorrelationId',
        },
      };
      const mockReportId = mockReportInDB.report_id;
      const mockReportAndCalculations: ReportAndCalculations = {
        report: {
          pay_transparency_company: {
            company_name: 'Mock company',
            address_line1: '123 main st.',
          },
          report_start_date: startDate,
          report_end_date: endDate,
          reporting_year: new Prisma.Decimal(2022),
          naics_code_pay_transparency_report_naics_codeTonaics_code: {
            naics_code: '1',
            naics_label: 'NAICS label',
          },
          employee_count_range: {
            employee_count_range: '100-399',
          },
          data_constraints: null,
          user_comments: null,
        },
        calculations: {},
      };
      mockReportAndCalculations.calculations[
        CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE
      ] = { value: GENDERS.MALE.code };

      jest
        .spyOn(reportService, 'getReportAndCalculations')
        .mockResolvedValueOnce(mockReportAndCalculations);

      const reportData: any = await reportService.getReportData(
        mockReq,
        mockReportId,
      );

      expect(reportService.getReportAndCalculations).toHaveBeenCalledTimes(1);

      // Confirm that correct report start and end dates are in the correct format
      const expectedStartDate = nativeJs(
        mockReportAndCalculations.report.report_start_date,
      ).format(DISPLAY_REPORT_DATE_FORMAT);
      const expectedEndDate = nativeJs(
        mockReportAndCalculations.report.report_end_date,
      ).format(DISPLAY_REPORT_DATE_FORMAT);
      expect(reportData.reportStartDate).toBe(expectedStartDate);
      expect(reportData.reportEndDate).toBe(expectedEndDate);
    });
  });
  describe('when all of the calculations are suppressed', () => {
    it('returns a report data object with null values for all calculated properties', async () => {
      const mockReq = {};
      const mockReportId = mockReportInDB.report_id;
      const mockReportAndCalculations: ReportAndCalculations = {
        report: {
          pay_transparency_company: {
            company_name: 'Mock company',
            address_line1: '123 main st.',
          },
          report_start_date: new Date(),
          report_end_date: new Date(),
          reporting_year: new Prisma.Decimal(2022),
          naics_code_pay_transparency_report_naics_codeTonaics_code: {
            naics_code: '1',
            naics_label: 'NAICS label',
          },
          employee_count_range: {
            employee_count_range: '100-399',
          },
          data_constraints: null,
          user_comments: null,
        },
        calculations: {},
      };
      mockReportAndCalculations.calculations[
        CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE
      ] = { value: null, isSuppressed: true };

      jest
        .spyOn(reportService, 'getReportAndCalculations')
        .mockResolvedValueOnce(mockReportAndCalculations);

      const reportData: any = await reportService.getReportData(
        mockReq,
        mockReportId,
      );

      expect(reportData.tableData).toBeNull();
      expect(reportData.chartData).toBeNull();
      expect(reportData.explanatoryNotes).toBeNull();
      expect(reportData.chartSuppressedError).toBeNull();
      expect(reportData.referenceGenderCategory).toBeNull();
      expect(reportData.isAllCalculatedDataSuppressed).toBeTruthy();
    });
  });
  describe('when the report data cannot be fetched', () => {
    it('returns a promise with null', async () => {
      const mockReq = {};
      const mockReportId = mockReportInDB.report_id;

      jest
        .spyOn(reportService, 'getReportAndCalculations')
        .mockResolvedValueOnce(null);

      const reportData = await reportService.getReportData(
        mockReq,
        mockReportId,
      );

      expect(reportData).toBeNull();
    });
  });
});

describe('getReportHtml', () => {
  describe('when a valid report id is provided', () => {
    it('returns an HTML string of the report', async () => {
      const mockReq = {
        session: {
          correlationID: 'mockCorrelationId',
        },
      };
      const mockReportId = mockReportInDB.report_id;
      const mockReportData = {};

      jest
        .spyOn(reportService, 'getReportData')
        .mockResolvedValueOnce(mockReportData);
      jest
        .spyOn(utils, 'postDataToDocGenService')
        .mockResolvedValueOnce('<html></html>');

      const html: string = await reportService.getReportHtml(
        mockReq,
        mockReportId,
      );

      expect(html).toBe('<html></html>');
    });
  });
});

describe('getReportPdf', () => {
  describe('when a valid report id is provided', () => {
    it('returns an Buffer of the report', async () => {
      const mockReq = {
        session: {
          correlationID: 'mockCorrelationId',
        },
      };
      const mockReportId = mockReportInDB.report_id;
      const mockReportData = {};

      const mockPdfStream = new stream.Readable();
      mockPdfStream.push('testpdf');
      mockPdfStream.push(null);

      jest
        .spyOn(reportService, 'getReportData')
        .mockResolvedValueOnce(mockReportData);
      jest
        .spyOn(utils, 'postDataToDocGenService')
        .mockResolvedValueOnce(mockPdfStream);

      const result: Buffer = await reportService.getReportPdf(
        mockReq,
        mockReportId,
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});

describe('genderCodeToGenderChartInfo', () => {
  describe('when a valid gender code is provided', () => {
    it('returns an object containing info about how the gender category should be depicted on charts', () => {
      Object.values(GENDERS)
        .map((d) => d.code)
        .forEach((genderCode) => {
          const genderChartInfo: GenderChartInfo =
            reportServicePrivate.genderCodeToGenderChartInfo(genderCode);
          expect(genderChartInfo?.code).toBe(genderCode);
          expect(genderChartInfo?.label).not.toBeNull();
          expect(genderChartInfo?.color).not.toBeNull();
        });
    });
  });
  describe('when an valid gender code is provided', () => {
    it('returns null', () => {
      const genderChartInfo: GenderChartInfo =
        reportServicePrivate.genderCodeToGenderChartInfo('NOT_A_GENDER_CODE');
      expect(genderChartInfo).toBeNull();
    });
  });
});

describe('getWageGapTextSummary', () => {
  describe('when a valid chartDataRecords array is provided', () => {
    it('returns an object containing info about how the gender category should be depicted on charts', () => {
      const referenceGenderCode = GENDERS.MALE.code;

      const mockCalcs = {};
      mockCalcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M] = {
        value: 0,
        isSuppressed: false,
      };
      mockCalcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W] = {
        value: 10.2,
        isSuppressed: false,
      };
      mockCalcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X] = {
        value: -5,
        isSuppressed: false,
      };
      mockCalcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U] = {
        value: -2,
        isSuppressed: false,
      };

      const mockChartData = [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) =>
          reportServicePrivate.toChartDataRecord(
            mockCalcs,
            d,
            reportServicePrivate.payGapPercentToDollar,
          ),
        )
        .filter((d) => d);

      const text: string = reportServicePrivate.getWageGapTextSummary(
        referenceGenderCode,
        mockChartData,
        'median',
        'bonus pay',
        false,
      );

      expect(text).not.toBeNull();
      expect(text).toContain('median');
      expect(text).toContain('bonus pay');
      expect(text).toContain(
        Math.round(mockCalcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W].value) +
          '% less',
      );
    });
  });
});

describe('getPercentSummary', () => {
  describe('when a valid chartDataRecords array is provided', () => {
    it('returns an object containing info about how the gender category should be depicted on charts', () => {
      const mockChartData = [
        {
          genderChartInfo: {
            code: 'M',
            label: 'Men',
            extendedLabel: 'Men',
            color: '#1c3664',
          },
          value: 3.9049394221808016,
        },
        {
          genderChartInfo: {
            code: 'F',
            label: 'Women',
            extendedLabel: 'Women',
            color: '#1b75bb',
          },
          value: 1.1846344485749691,
        },
        {
          genderChartInfo: {
            code: 'X',
            label: 'Non-binary',
            extendedLabel: 'Non-binary people',
            color: '#00a54f',
          },
          value: 0.11838989739542227,
        },
        {
          genderChartInfo: {
            code: 'U',
            label: 'Prefer not to say / Unknown',
            extendedLabel: 'Prefer not to say / Unknown',
            color: '#444444',
          },
          value: 0.41911984831853105,
        },
      ];

      const text: string = reportServicePrivate.getPercentSummary(
        mockChartData,
        'receive overtime pay',
      );

      expect(text).not.toBeNull();
      expect(text).toContain(
        'This graph describes that in this organization 4% of men receive overtime pay, 1% of women receive overtime pay, 0% of non-binary people receive overtime pay, and 0% of prefer not to say / unknown receive overtime pay.',
      );
    });
  });
});

describe('getHoursGapTextSummary', () => {
  describe('where no gender categories are suppressed', () => {
    it('returns summary text describing the OT hours data', () => {
      const referenceGenderCode = GENDERS.MALE.code;

      const mockCalcs = {};
      mockCalcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M] = {
        value: 0,
        isSuppressed: false,
      };
      mockCalcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W] = {
        value: -5,
        isSuppressed: false,
      };
      mockCalcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X] = {
        value: 8,
        isSuppressed: false,
      };
      mockCalcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U] = {
        value: 10,
        isSuppressed: false,
      };

      const mockTableData = [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .filter((d) => d.genderCode != referenceGenderCode)
        .map((d) =>
          reportServicePrivate.toChartDataRecord(mockCalcs, d, Math.round),
        )
        .filter((d) => d);

      const text: string = reportServicePrivate.getHoursGapTextSummary(
        referenceGenderCode,
        mockTableData,
        'median',
        'overtime hours',
      );

      expect(text).not.toBeNull();
      expect(text).toContain('median');
      expect(text).toContain('overtime hours');
      expect(text).toContain(
        Math.abs(mockCalcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W].value) +
          ' less',
      );
      expect(text).toContain(
        Math.abs(mockCalcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X].value) +
          ' more',
      );
    });
  });
  describe('when two gender categories are suppressed (leaving only the ref category and one other category)', () => {
    it('returns a non-null summary sentence', () => {
      const referenceGenderCode = GENDERS.MALE.code;

      const mockCalcs = {};
      mockCalcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W] = {
        value: -5,
        isSuppressed: false,
      };
      const mockTableData = [
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W,
        } as CalcCodeGenderCode,
      ]
        .filter((d) => d.genderCode != referenceGenderCode)
        .map((d) =>
          reportServicePrivate.toChartDataRecord(mockCalcs, d, Math.round),
        )
        .filter((d) => d);

      const text: string = reportServicePrivate.getHoursGapTextSummary(
        referenceGenderCode,
        mockTableData,
        'median',
        'overtime hours',
      );
      expect(text).not.toBeNull();
      expect(text).toContain('median');
      expect(text).toContain('overtime hours');
    });
  });
});

describe('getHourlyPayQuartilesTextSummary', () => {
  describe('given the ref gender category and hourly pay Q1 and Q4 data', () => {
    it('returns a text summary of the upper and lower quartiles', () => {
      const referenceGenderCode = GENDERS.MALE.code;
      const mockHourlyPayQuartile4 = [
        { genderChartInfo: GENDERS.MALE, value: 45 },
        { genderChartInfo: GENDERS.FEMALE, value: 45 },
        { genderChartInfo: GENDERS.NON_BINARY, value: 1 },
        { genderChartInfo: GENDERS.UNKNOWN, value: 9 },
      ];
      const mockHourlyPayQuartile1 = [
        { genderChartInfo: GENDERS.MALE, value: 55 },
        { genderChartInfo: GENDERS.FEMALE, value: 35 },
        { genderChartInfo: GENDERS.UNKNOWN, value: 10 },
      ];
      const text: string =
        reportServicePrivate.getHourlyPayQuartilesTextSummary(
          referenceGenderCode,
          mockHourlyPayQuartile4,
          mockHourlyPayQuartile1,
        );
      expect(text.toLowerCase()).toContain(
        `${GENDERS.FEMALE.extendedLabel} occupy 45% of the highest paid jobs and 35% of the lowest`.toLowerCase(),
      );
      expect(text.toLowerCase()).toContain(
        `${GENDERS.NON_BINARY.extendedLabel} occupy 1% of the highest paid jobs.`.toLowerCase(),
      );
    });
  });
});

describe('dollarsToText', () => {
  describe('when a value less than 1 is specified', () => {
    it('returns a value in cents', () => {
      const text = reportServicePrivate.dollarsToText(0.95);
      expect(text).toBe('95 cents');
    });
  });
  describe('when a value greater than 1 is specified', () => {
    it('returns a dollar string', () => {
      const text = reportServicePrivate.dollarsToText(1.2);
      expect(text).toBe('$1.20');
    });
  });
});

describe('prismaReportToReport', () => {
  it('converts a pay_transparency_report type into a Report type', () => {
    const resp = reportServicePrivate.prismaReportToReport(mockDraftReportInDb);
    expect(typeof resp.report_start_date).toBe('string');
    expect(typeof resp.report_end_date).toBe('string');
  });
});

describe('getReports', () => {
  it('returns an array of Report data', async () => {
    const dateNow: Date = convert(LocalDate.now()).toDate();
    const mockReportResults = {
      pay_transparency_report: [
        {
          report_id: '32655fd3-22b7-4b9a-86de-2bfc0fcf9102',
          report_start_date: dateNow,
          report_end_date: dateNow,
          create_date: dateNow,
          update_date: dateNow,
          reporting_year: dateNow.getDate(),
          revision: 1,
        },
        {
          report_id: '0cf3a2dd-4fa2-450e-a291-e9b44940e5ec',
          report_start_date: dateNow,
          report_end_date: dateNow,
          create_date: dateNow,
          update_date: dateNow,
          reporting_year: dateNow.getDate(),
          revision: 4,
        },
      ],
    };
    mockCompanyFindFirst.mockResolvedValue(mockReportResults);
    const ret = await reportService.getReports(mockCompanyInDB.company_id, {
      report_status: enumReportStatus.Draft,
      reporting_year: dateNow.getFullYear(),
    });
    expect(ret).toEqual(
      mockReportResults.pay_transparency_report.map((r) => ({
        ...r,
        report_start_date: nativeJs(dateNow).format(JSON_REPORT_DATE_FORMAT),
        report_end_date: nativeJs(dateNow).format(JSON_REPORT_DATE_FORMAT),
      })),
    );
  });
});

describe('publishReport', () => {
  describe("if the given report doesn't have status=Draft", () => {
    it('throws an error', async () => {
      await expect(
        reportService.publishReport(mockPublishedReportInApi),
      ).rejects.toEqual(new Error('Only draft reports can be published'));
    });
  });

  describe('if the given report has status=Draft, and there is no existing Published report', () => {
    it('changes the status from Draft to Published', async () => {
      mockReportFindFirst.mockResolvedValue(null);
      jest
        .spyOn(reportServicePrivate, 'movePublishedReportToHistory')
        .mockReturnValueOnce(null);

      await reportService.publishReport(mockDraftReportInApi);

      // Expect no attempt to move a pre-existing published report to
      // history (because there is no pre-existing published report)
      expect(
        reportServicePrivate.movePublishedReportToHistory,
      ).toHaveBeenCalledTimes(0);

      // Expect one call to update a DB record in the pay_transparency_report
      // table
      expect(prisma.pay_transparency_report.update).toHaveBeenCalledTimes(1);

      // Fetch the parameter passed to the update statement so we can
      // verify if performed the correct action
      const updateStatement = (
        prisma.pay_transparency_report.update as jest.Mock
      ).mock.calls[0][0];

      // Expect only one record to be updated (the report that was passed to
      // publishReport(...)
      expect(updateStatement.where.report_id).toBe(
        mockDraftReportInApi.report_id,
      );

      // Expect only one column to be updated (the report status_column)
      expect(updateStatement.data).toStrictEqual({
        report_status: enumReportStatus.Published,
        create_date: mockDraftReportInApi.create_date,
      });
    });
  });
  describe('if the given report has status=Draft, and there is an existing Published report', () => {
    it('archives the existing published report in history, and changes the status of the Draft to Published', async () => {
      mockReportFindFirst.mockResolvedValue(mockPublishedReportInDb);
      mockReportFindUnique.mockResolvedValue({
        ...mockPublishedReportInDb,
        pay_transparency_calculated_data: [],
      });
      jest
        .spyOn(reportServicePrivate, 'movePublishedReportToHistory')
        .mockReturnValueOnce(null);

      await reportService.publishReport(mockDraftReportInApi);

      // Expect an attempt to move the pre-existing published report to
      // history
      expect(
        reportServicePrivate.movePublishedReportToHistory,
      ).toHaveBeenCalledTimes(1);

      // Expect one call to update a DB record in the pay_transparency_report
      // table
      expect(prisma.pay_transparency_report.update).toHaveBeenCalledTimes(1);

      // Fetch the parameter passed to the update statement so we can
      // verify if performed the correct action
      const updateStatement = (
        prisma.pay_transparency_report.update as jest.Mock
      ).mock.calls[0][0];

      // Expect only one record to be updated (the report that was passed to
      // publishReport(...)
      expect(updateStatement.where.report_id).toBe(
        mockPublishedReportInDb.report_id,
      );
    });
  });
  describe('if the given report has status=Draft, and there is an existing Published and locked report', () => {
    it('should throw an error', async () => {
      mockReportFindFirst.mockResolvedValue({
        ...mockPublishedReportInDb,
        is_unlocked: false,
      });
      mockReportFindUnique.mockReturnValue({
        ...mockDraftReportInDb,
        is_unlocked: false,
        pay_transparency_calculated_data: [],
      });

      jest
        .spyOn(reportServicePrivate, 'movePublishedReportToHistory')
        .mockReturnValueOnce(null);

      await expect(
        reportService.publishReport(mockDraftReportInApi),
      ).rejects.toEqual(new Error(
        'A report for this time period already exists and cannot be updated.',
      ));
    });
  });
});

describe('movePublishedReportToHistory', () => {
  describe("if the given report isn't Published", () => {
    it('throws an error', async () => {
      const tx = jest.fn();
      await expect(
        actualMovePublishedReportToHistory(tx, mockDraftReportInDb),
      ).rejects.toThrow();
    });
  });
  describe('if the given report is Published', () => {
    it("copy it to history, delete it's calculated data, and delete the original record from reports", async () => {
      (prisma.report_history.create as jest.Mock).mockResolvedValue(
        mockHistoryReport,
      );
      (
        prisma.pay_transparency_calculated_data.findMany as jest.Mock
      ).mockResolvedValue(mockCalculatedDatasInDB);
      await prisma.$transaction(async (tx) => {
        await actualMovePublishedReportToHistory(tx, mockPublishedReportInDb);
      });

      // Confirm that the report was copied to the history table
      expect(prisma.report_history.create).toHaveBeenCalledTimes(1);
      const createReportHistory = (prisma.report_history.create as jest.Mock)
        .mock.calls[0][0];
      expect(createReportHistory.data.report_id).toBe(
        mockPublishedReportInDb.report_id,
      );

      // Confirm that the calculated data was got
      expect(
        prisma.pay_transparency_calculated_data.findMany,
      ).toHaveBeenCalledTimes(1);
      const findCalculated = (
        prisma.pay_transparency_calculated_data.findMany as jest.Mock
      ).mock.calls[0][0];
      expect(findCalculated.where.report_id).toBe(
        mockPublishedReportInDb.report_id,
      );

      // Confirm that the calculated data was copied to the history
      expect(prisma.calculated_data_history.createMany).toHaveBeenCalledTimes(
        1,
      );
      const createCalculatedHistory = (
        prisma.calculated_data_history.createMany as jest.Mock
      ).mock.calls[0][0];
      expect(createCalculatedHistory.data[0].report_history_id).toBe(
        mockHistoryReport.report_history_id,
      );

      // Confirm that the calculated datas were deleted
      expect(
        prisma.pay_transparency_calculated_data.deleteMany,
      ).toHaveBeenCalledTimes(1);
      const deleteCalcData = (
        prisma.pay_transparency_calculated_data.deleteMany as jest.Mock
      ).mock.calls[0][0];
      expect(deleteCalcData.where.report_id).toBe(
        mockPublishedReportInDb.report_id,
      );
    });
  });
});

describe('getReportById', () => {
  it('returns an single report with dates in the appropriate format', async () => {
    const dateNow: Date = convert(LocalDate.now()).toDate();
    const report = {
      report_id: '32655fd3-22b7-4b9a-86de-2bfc0fcf9102',
      report_start_date: dateNow,
      report_end_date: dateNow,
      create_date: dateNow,
      update_date: dateNow,
      revision: 1,
    };
    const expectedReport = {
      ...report,
      report_start_date: nativeJs(dateNow).format(JSON_REPORT_DATE_FORMAT),
      report_end_date: nativeJs(dateNow).format(JSON_REPORT_DATE_FORMAT),
    };
    const mockReportResults = {
      pay_transparency_report: [report],
    };
    mockCompanyFindFirst.mockResolvedValue(mockReportResults);
    const ret = await reportService.getReportById(
      mockCompanyInDB.company_id,
      report.report_id,
    );
    expect(ret).toEqual(expectedReport);
  });
});

describe('getReportFileName', () => {
  afterEach(() => {
    jest.useRealTimers();
  });
  it('returns a filename', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-12-10'));
    const reportInDb = {
      report_id: '32655fd3-22b7-4b9a-86de-2bfc0fcf9102',
      company_id: mockCompanyInDB.company_id,
      user_id: '1232344',
      user_comment: '',
      employee_count_range_id: '32655fd3-22b7-4b9a-86de-2bfc0fcf9102',
      naics_code: '11',
      report_start_date: convert(
        LocalDate.now(ZoneId.UTC).minusMonths(11),
      ).toDate(),
      report_end_date: convert(LocalDate.now(ZoneId.UTC)).toDate(),
      reporting_year: new Prisma.Decimal(2022),
      report_status: 'Published',
      revision: new Prisma.Decimal(1),
      data_constraints: '',
      create_date: new Date(),
      update_date: new Date(),
      create_user: 'User',
      update_user: 'User',
      is_unlocked: false,
      report_unlock_date: null,
    };
    const reportInApi = reportServicePrivate.prismaReportToReport(reportInDb);

    jest
      .spyOn(reportService, 'getReportById')
      .mockResolvedValueOnce(reportInApi);

    const ret = await reportService.getReportFileName(
      mockCompanyInDB.company_id,
      '32655fd3-22b7-4b9a-86de-2bfc0fcf9102',
    );
    expect(ret).toBe('pay_transparency_report_2023-01_2023-12.pdf');
  });
});

describe('shouldPreventReportOverride', () => {
  describe('when a published report exists for the same date period', () => {
    it('should prevent override if the report is older than 30 days', async () => {
      mockCompanyFindFirst.mockReturnValue({ company_id: '' });
      mockReportFindFirst.mockReturnValue({ report_id: '' });
      const result = await reportService.shouldPreventReportOverrides(
        LocalDate.now(),
        LocalDate.now(),
        '',
      );
      expect(result).toBeTruthy();
    });
  });
  describe('when a published report does not exist for the same date period', () => {
    it('should not prevent override', async () => {
      mockCompanyFindFirst.mockReturnValue({ company_id: '' });
      mockReportFindFirst.mockReturnValue(undefined);
      const result = await reportService.shouldPreventReportOverrides(
        LocalDate.now(),
        LocalDate.now(),
        '',
      );
      expect(result).toBeFalsy();
    });
  });
});
