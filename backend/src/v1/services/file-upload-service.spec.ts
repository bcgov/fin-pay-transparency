import { fileUploadService, fileUploadServicePrivate } from './file-upload-service';
import { validateService } from './validate-service';
const { mockRequest } = require('mock-req-res')

jest.mock('../services/validate-service');

afterEach(() => {
  jest.clearAllMocks();
});

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