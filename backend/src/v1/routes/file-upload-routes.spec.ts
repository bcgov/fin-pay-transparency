import { exportedForTesting } from './file-upload-routes';
import { validateService, FileErrors } from '../services/validate-service';

jest.mock('../services/validate-service')

afterEach(() => {
  jest.clearAllMocks();
  console.log("after each");
});

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
        status: jest.fn().mockReturnValue({json: (v) => {}})
      }
      exportedForTesting.validateSubmission(req, res, successCallback);
      expect(successCallback).toHaveBeenCalledTimes(1);      
    })
  })

  
  describe("when submission body is invalid", () => {

    it("calls returns an HTTP 400 error", () => {
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
        status: jest.fn().mockReturnValue({json: (v) => {}})
      }
      exportedForTesting.validateSubmission(req, res, successCallback);
      expect(successCallback).toHaveBeenCalledTimes(0);
      expect(res.status).toHaveBeenCalledWith(400);
    })
  })
  

})