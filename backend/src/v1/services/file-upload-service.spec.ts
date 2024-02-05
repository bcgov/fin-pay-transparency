import prisma from '../prisma/prisma-client';
import { codeService } from './code-service';
import {
  REPORT_STATUS,
  fileUploadService,
  fileUploadServicePrivate,
} from './file-upload-service';
import { CalculatedAmount } from './report-calc-service';
import { utils } from './utils-service';
import { validateService } from './validate-service';
const { mockRequest } = require('mock-req-res');

const MOCK_CALCULATION_CODES = {
  mock_calculation_code_1: 'calculation_id_1',
  mock_calculation_code_2: 'calculation_id_2',
};

//Mock only the updateManyUnsafe method in file-upload-service (for all other methods
//in this module keep the original implementation)
jest.mock('./file-upload-service', () => {
  const actual = jest.requireActual('./file-upload-service');
  const mocked = jest.genMockFromModule('./file-upload-service') as any;

  return {
    ...mocked,
    ...actual,
    fileUploadService: {
      ...mocked.fileUploadService,
      ...actual.fileUploadService,
      updateManyUnsafe: jest.fn().mockResolvedValue(null),
    },
  };
});
const actualFileUploadService = jest.requireActual(
  './file-upload-service',
).fileUploadService;

jest.mock('./validate-service');
jest.mock('./utils-service');
jest.mock('./code-service');
(codeService.getAllCalculationCodesAndIds as jest.Mock).mockResolvedValue(
  MOCK_CALCULATION_CODES,
);

afterEach(() => {
  jest.clearAllMocks();
});

jest.mock('../prisma/prisma-client', () => {
  return {
    pay_transparency_company: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pay_transparency_user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pay_transparency_report: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pay_transparency_calculated_data: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
  };
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
const mockUserInDB = {
  user_id: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
  display_name: 'Test User',
  bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
  bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
};
const mockUserInfo = {
  jwt: 'validJwt',
  _json: {
    bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
    bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
    display_name: 'Test User',
  },
};

describe('postFileUploadHandler', () => {
  describe('when request is invalid', () => {
    it('response has an error code', (done) => {
      const req = mockRequest();
      const res = {
        status: jest.fn().mockReturnValue({ json: (v) => {} }),
      };
      const next = jest.fn();
      const callback = jest.fn().mockImplementation(() => {
        try {
          expect(res.status).toHaveBeenCalledWith(500);
          done();
        } catch (err) {
          done(err);
        }
      });
      fileUploadService.handleFileUpload(req, res, callback);
    });
  });
});

describe('saveReportBody', () => {
  const req = {
    body: {
      startDate: '2020-01-01',
      endDate: '2020-12-31',
      comments: null,
      dataConstraints: null,
      employee_count_range_id: '123456',
      naicsCode: '11',
    },
  };
  (prisma.pay_transparency_company.findFirst as jest.Mock).mockResolvedValue(
    mockCompanyInDB,
  );
  (prisma.pay_transparency_user.findFirst as jest.Mock).mockResolvedValue(
    mockUserInDB,
  );

  (utils.getSessionUser as jest.Mock).mockReturnValue(mockUserInfo);

  describe("when the report isn't yet in the database", () => {
    const existingReport = null;
    const newReport = {
      reportId: 1,
    };
    (
      prisma.pay_transparency_report.findFirst as jest.Mock
    ).mockResolvedValueOnce(existingReport);
    (prisma.pay_transparency_report.create as jest.Mock).mockResolvedValueOnce(
      newReport,
    );
    it('saves a new draft report', async () => {
      await fileUploadService.saveReportBody(req, prisma);
      expect(prisma.pay_transparency_report.create).toHaveBeenCalled();
    });
  });

  describe('when draft report already exists', () => {
    const existingReport = {
      reportId: '1',
      revision: 1,
      report_status: REPORT_STATUS.DRAFT,
    };
    (
      prisma.pay_transparency_report.findFirst as jest.Mock
    ).mockResolvedValueOnce(existingReport);

    it('updated the existing report', async () => {
      await fileUploadService.saveReportBody(req, prisma);
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
      (
        prisma.pay_transparency_calculated_data.findMany as jest.Mock
      ).mockResolvedValue(existingCalculatedData);
      (
        prisma.pay_transparency_calculated_data.createMany as jest.Mock
      ).mockResolvedValue(null);
      (fileUploadService.updateManyUnsafe as jest.Mock).mockResolvedValue(null);
      await fileUploadService.saveReportCalculations(
        mockCalculatedAmounts,
        reportId,
        prisma,
      );
      expect(codeService.getAllCalculationCodesAndIds).toHaveBeenCalled();
      expect(fileUploadService.updateManyUnsafe).toHaveBeenCalledTimes(0);
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
      (
        prisma.pay_transparency_calculated_data.findMany as jest.Mock
      ).mockResolvedValue(existingCalculatedData);
      (
        prisma.pay_transparency_calculated_data.createMany as jest.Mock
      ).mockResolvedValue(null);
      (fileUploadService.updateManyUnsafe as jest.Mock).mockResolvedValue(null);
      await fileUploadService.saveReportCalculations(
        mockCalculatedAmounts,
        reportId,
        prisma,
      );
      expect(codeService.getAllCalculationCodesAndIds).toHaveBeenCalled();
      expect(
        prisma.pay_transparency_calculated_data.createMany,
      ).toHaveBeenCalledTimes(0);
      expect(fileUploadService.updateManyUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('when saving a calculation with an invalid calculation code', () => {
    const reportId = 'mock_report_id';
    const existingCalculatedData = [{}];
    const mockCalculatedAmounts: CalculatedAmount[] = [
      { calculationCode: 'invalid code', value: '1', isSuppressed: false },
    ];

    it('throws an error', async () => {
      (
        prisma.pay_transparency_calculated_data.findMany as jest.Mock
      ).mockResolvedValue(existingCalculatedData);
      (
        prisma.pay_transparency_calculated_data.createMany as jest.Mock
      ).mockResolvedValue(null);
      (fileUploadService.updateManyUnsafe as jest.Mock).mockResolvedValue(null);
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

describe('updateManyUnsafe', () => {
  describe('when requesting that multiple records in a given table be updated', () => {
    it('creates and executes a bulk update statement against the database', () => {
      const mockTx = {
        $executeRawUnsafe: jest.fn(),
      };
      const updates = [
        { mock_table_id: '1', another_col: 'aaa' },
        { mock_table_id: '2', another_col: 'bbb' },
      ];
      const mockTableName = 'mock_table';
      const primaryKeyCol = 'mock_table_id';

      actualFileUploadService.updateManyUnsafe(
        mockTx,
        updates,
        mockTableName,
        primaryKeyCol,
      );

      expect(mockTx.$executeRawUnsafe).toHaveBeenCalledTimes(1);

      // Get the SQL was was submitted to the database
      const executedSql = mockTx.$executeRawUnsafe.mock.calls[0][0];

      // Check that the submitted SQL includes several expected keywords
      // (We stop short of checking the exact format of the SQL and that
      // it is valid according to the database engine.)
      expect(executedSql.toLowerCase()).toContain(`update ${mockTableName}`);
      expect(executedSql.toLowerCase()).toContain('set');
      expect(executedSql.toLowerCase()).toContain('where');
      Object.keys(updates[0]).forEach((k) => {
        expect(executedSql).toContain(k);
      });
    });
  });
});

describe('validateSubmission', () => {
  describe('when submission is valid', () => {
    it('calls the success callback', () => {
      //mock a response indicating the body is valid
      (validateService.validateBody as jest.Mock).mockReturnValue(
        [] as string[],
      );

      //mock a response indicating the CSV file is valid
      (validateService.validateCsv as jest.Mock).mockReturnValue(null);

      const successCallback = jest.fn();
      const req = {
        body: {},
        file: {
          buffer: null,
        },
      };
      const res = {
        status: jest.fn().mockReturnValue({ json: (v) => {} }),
      };
      const isValid = fileUploadServicePrivate.validateSubmission(req, res);
      expect(isValid).toBeTruthy();
    });
  });

  describe('when submission body is invalid', () => {
    it('sets 400 error code in the response', () => {
      //mock a response indicating the body is valid
      (validateService.validateBody as jest.Mock).mockReturnValue([
        'Error message',
      ]);

      //mock a response indicating the CSV file is valid
      (validateService.validateCsv as jest.Mock).mockReturnValue(null);

      const successCallback = jest.fn();
      const req = {
        body: {},
        file: {
          buffer: null,
        },
      };
      const res = {
        status: jest.fn().mockReturnValue({ json: (v) => {} }),
      };
      const isValid = fileUploadServicePrivate.validateSubmission(req, res);
      expect(isValid).toBeFalsy();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('when validation throws an error', () => {
    it('sets a 500 error code in the response', () => {
      //mock a response indicating the body is valid
      (validateService.validateBody as jest.Mock).mockReturnValue([]);

      //mock a response indicating the CSV file is valid
      (validateService.validateCsv as jest.Mock).mockImplementation(() => {
        throw new Error('some error');
      });

      const successCallback = jest.fn();
      const req = {
        body: {},
        file: {
          buffer: null,
        },
      };
      const res = {
        status: jest.fn().mockReturnValue({ json: (v) => {} }),
      };
      const isValid = fileUploadServicePrivate.validateSubmission(req, res);
      expect(isValid).toBeFalsy();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
