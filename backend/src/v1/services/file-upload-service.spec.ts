import { vi, describe, it, expect, beforeEach } from 'vitest';
import prisma from '../prisma/__mocks__/prisma-client.js';
import { codeService } from './code-service.js';
import { fileUploadService } from './file-upload-service.js';
import { CalculatedAmount } from './report-calc-service.js';
import { enumReportStatus } from './report-service.js';
import { utils } from './utils-service.js';
import { SUBMISSION_ROW_COLUMNS } from './validate-service.js';
import { createSampleRecord } from './validate-service.spec.js';
import type {
  pay_transparency_company,
  pay_transparency_report,
  pay_transparency_user,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const MOCK_CALCULATION_CODES = {
  mock_calculation_code_1: 'calculation_id_1',
  mock_calculation_code_2: 'calculation_id_2',
};

const mockRecordOverrides = {};
mockRecordOverrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = '10';
mockRecordOverrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = '20';
const mockRecord = createSampleRecord(mockRecordOverrides);
const mockValidSubmission = {
  companyName: '',
  companyAddress: '',
  naicsCode: '',
  employeeCountRangeId: '',
  startDate: '2022-01-01',
  endDate: '2022-12-31',
  reportingYear: 2022,
  dataConstraints: null,
  comments: null,
  rows: [Object.keys(mockRecord), Object.values(mockRecord)],
};

vi.mock('./utils-service');
vi.mock('./code-service');

beforeEach(() => {
  vi.mocked(codeService.getAllCalculationCodesAndIds).mockResolvedValue(
    MOCK_CALCULATION_CODES,
  );
});

vi.mock('../prisma/prisma-client');

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
} as pay_transparency_company;
const mockUserInDB = {
  user_id: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
  display_name: 'Test User',
  bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
  bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
} as pay_transparency_user;
const mockUserInfo = {
  jwt: 'validJwt',
  _json: {
    bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
    bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
    display_name: 'Test User',
  },
};

describe('handleSubmission', () => {
  describe(`when a submission has no 'rows'`, () => {
    it('returns an error object', async () => {
      const mockInvalidSubmission = { ...mockValidSubmission, rows: null };
      const result = await fileUploadService.handleSubmission(
        mockUserInfo,
        mockInvalidSubmission,
      );
      expect(result).toBeTruthy();
    });
  });
});

describe('saveSubmissionAsReport', () => {
  beforeEach(() => {
    prisma.pay_transparency_company.findFirst.mockResolvedValue(
      mockCompanyInDB,
    );
    prisma.pay_transparency_user.findFirst.mockResolvedValue(mockUserInDB);
  });
  vi.mocked(utils.getSessionUser).mockReturnValue(mockUserInfo);

  describe("when the report isn't yet in the database", () => {
    it('saves a new draft report', async () => {
      const existingReport = null;
      const newReport = {
        report_id: '1',
        revision: Decimal(1),
        report_status: enumReportStatus.Draft,
      } as pay_transparency_report;

      prisma.pay_transparency_report.findFirst.mockResolvedValueOnce(
        existingReport,
      );
      prisma.pay_transparency_report.create.mockResolvedValueOnce(newReport);
      await fileUploadService.saveSubmissionAsReport(
        mockValidSubmission,
        mockUserInfo,
        prisma,
      );
      expect(prisma.pay_transparency_report.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.pay_transparency_report.create).toHaveBeenCalled();
    });
  });

  describe('when draft report already exists', () => {
    it('updated the existing report', async () => {
      const existingReport = {
        report_id: '1',
        revision: Decimal(1),
        report_status: enumReportStatus.Draft,
        reporting_year: Decimal(new Date().getFullYear()),
      } as pay_transparency_report;

      prisma.pay_transparency_report.findFirst.mockResolvedValueOnce(
        existingReport,
      );
      await fileUploadService.saveSubmissionAsReport(
        mockValidSubmission,
        mockUserInfo,
        prisma,
      );

      // Confirm that the database fetch of the existing report
      // filters by all the fields that are unique to a draft report
      // (company_id, user_id, reporting_year, report_status).
      const existingReportFilter =
        prisma.pay_transparency_report.findFirst.mock.calls[0][0].where;
      expect(existingReportFilter).toHaveProperty('company_id');
      expect(existingReportFilter).toHaveProperty('user_id');
      expect(existingReportFilter.reporting_year).toBe(
        mockValidSubmission.reportingYear,
      );
      expect(existingReportFilter.report_status).toBe(enumReportStatus.Draft);

      //Check that the existing report was updated
      expect(prisma.pay_transparency_report.update).toHaveBeenCalled();
    });
  });
});

describe('saveReportCalculations', () => {
  describe("when the calculations aren't yet in the database", () => {
    const existingCalculatedData = [];
    const reportId = 'mock_report_id';
    const mockCalculatedAmounts: CalculatedAmount[] = [];
    Object.keys(MOCK_CALCULATION_CODES).forEach((code) => {
      mockCalculatedAmounts.push({
        calculationCode: code,
        value: '1',
        isSuppressed: false,
      });
    });

    it('saves the calculations to new records', async () => {
      prisma.pay_transparency_calculated_data.findMany.mockResolvedValue(
        existingCalculatedData,
      );

      prisma.pay_transparency_calculated_data.createMany.mockResolvedValue(
        null,
      );
      vi.mocked(utils.updateManyUnsafe).mockResolvedValue(null);
      await fileUploadService.saveReportCalculations(
        mockCalculatedAmounts,
        reportId,
        prisma,
      );
      expect(codeService.getAllCalculationCodesAndIds).toHaveBeenCalled();
      expect(utils.updateManyUnsafe).toHaveBeenCalledTimes(0);
      expect(
        prisma.pay_transparency_calculated_data.createMany,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the calculations are already in the database', () => {
    const reportId = 'mock_report_id';
    const existingCalculatedData = [];
    const mockCalculatedAmounts: CalculatedAmount[] = [];
    Object.keys(MOCK_CALCULATION_CODES).forEach((code) => {
      existingCalculatedData.push({
        calculation_code_id: MOCK_CALCULATION_CODES[code],
      });
      mockCalculatedAmounts.push({
        calculationCode: code,
        value: '1',
        isSuppressed: false,
      });
    });

    it('updates the existing calculated data records', async () => {
      prisma.pay_transparency_calculated_data.findMany.mockResolvedValue(
        existingCalculatedData,
      );
      prisma.pay_transparency_calculated_data.createMany.mockResolvedValue(
        null,
      );
      vi.mocked(utils.updateManyUnsafe).mockResolvedValue(null);
      await fileUploadService.saveReportCalculations(
        mockCalculatedAmounts,
        reportId,
        prisma,
      );
      expect(codeService.getAllCalculationCodesAndIds).toHaveBeenCalled();
      expect(
        prisma.pay_transparency_calculated_data.createMany,
      ).toHaveBeenCalledTimes(0);
      expect(utils.updateManyUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('when saving a calculation with an invalid calculation code', () => {
    const reportId = 'mock_report_id';
    const existingCalculatedData = [{}];
    const mockCalculatedAmounts: CalculatedAmount[] = [
      { calculationCode: 'invalid code', value: '1', isSuppressed: false },
    ];

    it('throws an error', async () => {
      prisma.pay_transparency_calculated_data.findMany.mockResolvedValue(
        existingCalculatedData,
      );

      prisma.pay_transparency_calculated_data.createMany.mockResolvedValue(
        null,
      );
      vi.mocked(utils.updateManyUnsafe).mockResolvedValue(null);
      await expect(
        fileUploadService.saveReportCalculations(
          mockCalculatedAmounts,
          reportId,
          prisma,
        ),
      ).rejects.toThrow();
    });
  });
});
