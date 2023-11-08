import { app } from './app';
import prisma from './v1/prisma/prisma-client';
import { auth } from './v1/services/auth-service';
import { utils } from './v1/services/utils-service';
const request = require('supertest');

const validFrontendToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTk0MDY0NDksImV4cCI6MTY5OTQwODI0OSwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgxIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwic3ViIjoidXNlckBmaW5wYXl0cmFuc3BhcmVuY3kuY2EifQ.EPKQXLlhotXGMD3fSJT32McYWB1UJR0HwwaTGiRmKUO-hyqvhezODtPV7J6o0r3aBvUePXfpecYRpVVlDtTUDlBeaiiMXzhe40I60OTLkCUy0xHK-ELGbBZtt_wHwjcwRCwkp0Hdswn2wITMJgH0l7xguCao2CYv22pVftzOrSbVE12f7b1nL4pUYLzmQvy1iJO3jIU-i8sNxjGQFJAS37f5FQsIWbyv82DNqgxgrBz8nROtpQ2etQQ15iKlQlQaJ9nosvo0epAmkeGjLCnte5Wy2yYYuEFdJ-5XN3Y_zS89u7OhSuWAaPhzO0ZR_Il09gCkskyZYo3S8SgpAelYStLtVl5q3UVYARIIXGNZJSIUG23G8_EfYdLZHJdNAYGKNsHAP7UV_3L-_USwJmRM6IgcN0DsEOWtBAYFsNv7oJf1U3g_LrEj5JaHGfaEfkVgjvI3OMvamnIAF8XcRuFh9mFn-g050e99D4iNZn0vt9cJQbOXBuBjcxezLnvySkfngY62JidzYdnsb1RndfpFjbltCoAXhkZlxOzwZul6NsSFRqCV8Id8hGqgF_PvZYVaHvhBPAt0yPr7UKv_94mY6Stza8JMrYDRBZy1RRRGHbnCgNTd-qpIneRoWQ_6mvmfc_3WQOPZAoIUfAuFFH8YZP9W4IKq4GsD2rft-wvymyw';
const invalidFrontendToken = 'g37hTtciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2OTk0MDY0NDksImV4cCI6MTY5OTQwODI0OSwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgxIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwic3ViIjoidXNlckBmaW5wYXl0cmFuc3BhcmVuY3kuY2EifQ.EPKQXLlhotXGMD3fSJT32McYWB1UJR0HwwaTGiRmKUO-hyqvhezODtPV7J6o0r3aBvUePXfpecYRpVVlDtTUDlBeaiiMXzhe40I60OTLkCUy0xHK-ELGbBZtt_wHwjcwRCwkp0Hdswn2wITMJgH0l7xguCao2CYv22pVftzOrSbVE12f7b1nL4pUYLzmQvy1iJO3jIU-i8sNxjGQFJAS37f5FQsIWbyv82DNqgxgrBz8nROtpQ2etQQ15iKlQlQaJ9nosvo0epAmkeGjLCnte5Wy2yYYuEFdJ-5XN3Y_zS89u7OhSuWAaPhzO0ZR_Il09gCkskyZYo3S8SgpAelYStLtVl5q3UVYARIIXGNZJSIUG23G8_EfYdLZHJdNAYGKNsHAP7UV_3L-_USwJmRM6IgcN0DsEOWtBAYFsNv7oJf1U3g_LrEj5JaHGfaEfkVgjvI3OMvamnIAF8XcRuFh9mFn-g050e99D4iNZn0vt9cJQbOXBuBjcxezLnvySkfngY62JidzYdnsb1RndfpFjbltCoAXhkZlxOzwZul6gFdFRqCV8Id8hGqgF_PvZYVaHvhBPAt0yPr7UKv_94mY6Stza8JMrYDRBZy1RRRGHbnCgNTd-qpIneRoWQ_6mvmfc_3WQOPZAoIUfAuFFH8YZP9W4IKq4GsD2223-GfEmxd';

//In utils-service mock only those methods that make calls to remote services
//(for all other methods in this module keep the original implementation)
jest.mock('./v1/services/utils-service', () => {
  const actualUtils = jest.requireActual('./v1/services/utils-service').utils
  return {
    utils: {
      ...actualUtils,
      getOidcDiscovery: jest.fn().mockResolvedValue({
        issuer: "ABC",
        authorization_endpoint: "fake url",
        token_endpoint: "fake url",
        userinfo_endpoint: "fake url"
      }),
      getKeycloakPublicKey: jest.fn(),
    }
  }
})
utils; //this statement is to keep linters from deleting the import for this module

jest.mock('./v1/prisma/prisma-client', () => {
  return {
    employee_count_range: {
      findMany: jest.fn()
    }
  }
})

jest.mock('./v1/services/auth-service', () => {
  const actualAuth = jest.requireActual('./v1/services/auth-service').auth
  const mockedAuth = (jest.genMockFromModule('./v1/services/auth-service') as any).auth;

  return {
    auth: {
      ...mockedAuth,
      ...actualAuth,
      isValidBackendToken: jest.fn().mockReturnValue(async (req, res, next) => { next() })
    }
  }
});
auth; //this statement is to keep linters from deleting the import for this module

afterEach(() => {
  jest.clearAllMocks();
});

describe("GET /employee-count-range", () => {
  describe("given a valid 'frontend token' in the Authorization header", () => {
    it("responds with HTTP 200 and a JSON array of values in the body", async () => {
      // Mock the database query executed by the API endpoint's implementation:
      // (a call to codeService.getAllEmployeeCountRanges)
      const mockDBResp = [
        {
          employee_count_range_id: 'ea8b2547-4e93-4bfa-aec1-3e90f91027dd',
          employee_count_range: '1-99'
        }
      ];
      (prisma.employee_count_range.findMany as jest.Mock).mockResolvedValue(mockDBResp);

      const res = await request(app)
        .get("/api/v1/codes/employee-count-ranges")
        .set('Authorization', 'Bearer ' + validFrontendToken)
        .set('Accept', 'application/json')

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("application/json");
      expect(res.body[0].employee_count_range).toBe(mockDBResp[0].employee_count_range);

    })
  })
  describe("given an invalid 'frontend token' in the Authorization header", () => {
    it("returns HTTP 401 (unauthorized)", async () => {
      // Mock the database query executed by the API endpoint's implementation:
      // (a call to codeService.getAllEmployeeCountRanges)
      const mockDBResp = [
        {
          employee_count_range_id: 'ea8b2547-4e93-4bfa-aec1-3e90f91027dd',
          employee_count_range: '1-99'
        }
      ];
      (prisma.employee_count_range.findMany as jest.Mock).mockResolvedValue(mockDBResp);

      const res = await request(app)
        .get("/api/v1/codes/employee-count-ranges")
        .set('Authorization', 'Bearer ' + invalidFrontendToken)
        .set('Accept', 'application/json')

      expect(res.statusCode).toBe(401);

    })
  })
})