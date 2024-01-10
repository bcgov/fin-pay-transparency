import prisma from '../prisma/prisma-client';
import { codeService } from './code-service';
import { PayTransparencyUserError, REPORT_STATUS, fileUploadService, fileUploadServicePrivate } from './file-upload-service';
import { CalculatedAmount } from './report-calc-service';
import { utils } from './utils-service';
import { validateService } from './validate-service';
const { mockRequest } = require('mock-req-res')

const MOCK_CALCULATION_CODES = {
  "mock_calculation_code_1": "calculation_id_1",
  "mock_calculation_code_2": "calculation_id_2"
}

//Mock only the updateMany method in file-upload-service (for all other methods
//in this module keep the original implementation)
jest.mock('./file-upload-service', () => {
  const actual = jest.requireActual('./file-upload-service')
  const mocked = (jest.genMockFromModule('./file-upload-service') as any);

  return {
    ...mocked,
    ...actual,
    fileUploadService: {
      ...mocked.fileUploadService,
      ...actual.fileUploadService,
      updateMany: jest.fn().mockResolvedValue(null)
    }
  }
})

jest.mock('./validate-service');
jest.mock('./utils-service');
jest.mock('./code-service');
(codeService.getAllCalculationCodesAndIds as jest.Mock).mockResolvedValue(MOCK_CALCULATION_CODES);

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
  }
})

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
  update_date: new Date()
};
const mockUserInDB = {
  user_id: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
  display_name: 'Test User',
  bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3',  // random guid
  bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
};
const mockUserInfo = {
  jwt: 'validJwt',
  _json: {
    bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3',  // random guid
    bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
    display_name: 'Test User',
  },
};

describe("postFileUploadHandler", () => {
  describe("when request is invalid", () => {
    it("response has an error code", (done) => {
      const req = mockRequest();
      const res = {
        status: jest.fn().mockReturnValue({ json: (v) => { } })
      }
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
    })
  })
})

describe("saveReportBody", () => {
  const req = {
    body: {
      startDate: "2020-01",
      endDate: "2020-12",
      comments: null,
      dataConstraints: null,
      employee_count_range_id: "123456",
      naicsCode: "11"
    }
  };
  (prisma.pay_transparency_company.findFirst as jest.Mock).mockResolvedValue(mockCompanyInDB);
  (prisma.pay_transparency_user.findFirst as jest.Mock).mockResolvedValue(mockUserInDB);

  (utils.getSessionUser as jest.Mock).mockReturnValue(mockUserInfo);

  describe("when the report isn't yet in the database", () => {
    const existingReport = null;
    const newReport = {
      reportId: 1
    };
    (prisma.pay_transparency_report.findFirst as jest.Mock).mockResolvedValueOnce(existingReport);
    (prisma.pay_transparency_report.create as jest.Mock).mockResolvedValueOnce(newReport);
    it("saves a new report", async () => {
      await fileUploadService.saveReportBody(req, prisma)
      expect(prisma.pay_transparency_report.create).toHaveBeenCalled();
    })
  })

  describe("when published report already exists", () => {
    const existingReport = {
      reportId: "1",
      revision: 1,
      report_status: REPORT_STATUS.PUBLISHED
    };
    (prisma.pay_transparency_report.findFirst as jest.Mock).mockResolvedValueOnce(existingReport);
    it("throws PayTransparencyUserError", async () => {
      await expect(fileUploadService.saveReportBody(req, prisma)).rejects.toThrow(PayTransparencyUserError);
    })
  })

  describe("when draft report already exists", () => {
    const existingReport = {
      reportId: "1",
      revision: 1,
      report_status: REPORT_STATUS.DRAFT
    };
    (prisma.pay_transparency_report.findFirst as jest.Mock).mockResolvedValueOnce(existingReport);

    it("updated the existing report", async () => {
      await fileUploadService.saveReportBody(req, prisma)
      expect(prisma.pay_transparency_report.update).toHaveBeenCalled();
    })
  })

})

describe("saveReportCalculations", () => {

  describe("when the calculations aren't yet in the database", () => {
    const existingCalculatedData = [];
    const reportId = "mock_report_id";
    const mockCalculatedAmounts: CalculatedAmount[] = [];
    Object.keys(MOCK_CALCULATION_CODES).forEach(code => {
      mockCalculatedAmounts.push({ calculationCode: code, value: "1", isSuppressed: false })
    })

    it("saves the calculations to new records", async () => {
      (prisma.pay_transparency_calculated_data.findMany as jest.Mock).mockResolvedValue(existingCalculatedData);
      (prisma.pay_transparency_calculated_data.createMany as jest.Mock).mockResolvedValue(null);
      (fileUploadService.updateMany as jest.Mock).mockResolvedValue(null);
      await fileUploadService.saveReportCalculations(mockCalculatedAmounts, reportId, prisma)
      expect(codeService.getAllCalculationCodesAndIds).toHaveBeenCalled();
      expect(fileUploadService.updateMany).toHaveBeenCalledTimes(0);
      expect(prisma.pay_transparency_calculated_data.createMany).toHaveBeenCalledTimes(1);
    })
  })

  describe("when the calculations are already in the database", () => {
    const reportId = "mock_report_id";
    const existingCalculatedData = [];
    const mockCalculatedAmounts: CalculatedAmount[] = [];
    Object.keys(MOCK_CALCULATION_CODES).forEach((code) => {
      existingCalculatedData.push({ calculation_code_id: MOCK_CALCULATION_CODES[code] })
      mockCalculatedAmounts.push({ calculationCode: code, value: "1", isSuppressed: false })
    })

    it("updates the existing calculated data records", async () => {
      (prisma.pay_transparency_calculated_data.findMany as jest.Mock).mockResolvedValue(existingCalculatedData);
      (prisma.pay_transparency_calculated_data.createMany as jest.Mock).mockResolvedValue(null);
      (fileUploadService.updateMany as jest.Mock).mockResolvedValue(null);
      await fileUploadService.saveReportCalculations(mockCalculatedAmounts, reportId, prisma)
      expect(codeService.getAllCalculationCodesAndIds).toHaveBeenCalled();
      expect(prisma.pay_transparency_calculated_data.createMany).toHaveBeenCalledTimes(0);
      expect(fileUploadService.updateMany).toHaveBeenCalledTimes(1);
    })
  })

  describe("when saving a calculation with an invalid calculation code", () => {
    const reportId = "mock_report_id";
    const existingCalculatedData = [{}];
    const mockCalculatedAmounts: CalculatedAmount[] = [
      { calculationCode: "invalid code", value: "1", isSuppressed: false }
    ];

    it("throws an error", async () => {
      (prisma.pay_transparency_calculated_data.findMany as jest.Mock).mockResolvedValue(existingCalculatedData);
      (prisma.pay_transparency_calculated_data.createMany as jest.Mock).mockResolvedValue(null);
      (fileUploadService.updateMany as jest.Mock).mockResolvedValue(null);
      await expect(fileUploadService.saveReportCalculations(mockCalculatedAmounts, reportId, prisma)).rejects.toThrow();
    })
  })

})

describe("validateSubmission", () => {
  describe("when submission is valid", () => {

    it("calls the success callback", () => {

      //mock a response indicating the body is valid
      (validateService.validateBody as jest.Mock).mockReturnValue([] as string[]);

      //mock a response indicating the CSV file is valid
      (validateService.validateCsv as jest.Mock).mockReturnValue(null);

      const successCallback = jest.fn();
      const req = {
        body: {},
        file: {
          buffer: null
        }
      }
      const res = {
        status: jest.fn().mockReturnValue({ json: (v) => { } })
      }
      const isValid = fileUploadServicePrivate.validateSubmission(req, res);
      expect(isValid).toBeTruthy();
    })
  })


  describe("when submission body is invalid", () => {

    it("sets 400 error code in the response", () => {
      //mock a response indicating the body is valid
      (validateService.validateBody as jest.Mock).mockReturnValue(["Error message"]);

      //mock a response indicating the CSV file is valid
      (validateService.validateCsv as jest.Mock).mockReturnValue(null);

      const successCallback = jest.fn();
      const req = {
        body: {},
        file: {
          buffer: null
        }
      }
      const res = {
        status: jest.fn().mockReturnValue({ json: (v) => { } })
      }
      const isValid = fileUploadServicePrivate.validateSubmission(req, res);
      expect(isValid).toBeFalsy();
      expect(res.status).toHaveBeenCalledWith(400);
    })
  })

  describe("when validation throws an error", () => {

    it("sets a 500 error code in the response", () => {
      //mock a response indicating the body is valid
      (validateService.validateBody as jest.Mock).mockReturnValue([]);

      //mock a response indicating the CSV file is valid
      (validateService.validateCsv as jest.Mock).mockImplementation(() => { throw new Error("some error") });

      const successCallback = jest.fn();
      const req = {
        body: {},
        file: {
          buffer: null
        }
      }
      const res = {
        status: jest.fn().mockReturnValue({ json: (v) => { } })
      }
      const isValid = fileUploadServicePrivate.validateSubmission(req, res);
      expect(isValid).toBeFalsy();
      expect(res.status).toHaveBeenCalledWith(500);
    })
  })


})
