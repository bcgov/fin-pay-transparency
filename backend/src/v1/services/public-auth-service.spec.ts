import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import jsonwebtoken from 'jsonwebtoken';
import * as bceidService from '../../external/services/bceid-service.js';
import prisma from '../prisma/__mocks__/prisma-client.js';
import { LogoutReason, publicAuth } from './public-auth-service.js';
import { utils } from './utils-service.js';
import type { pay_transparency_user } from '@prisma/client';

//Mock the entire axios module so we never inadvertently make real
//HTTP calls to remote services
vi.mock('axios');

vi.mock('../prisma/prisma-client');

//Mock only the renew method in auth-service (for all other methods
//in this module keep the original implementation)

vi.mock(import('./public-auth-service.js'), async (importOriginal) => {
  const actual = await importOriginal();
  const mocked = {
    ...actual,
    publicAuth: Object.create(actual.publicAuth),
  };
  mocked.publicAuth.renew = vi.fn();
  return mocked;
});

//Keep a copy of the non-mocked auth-service because certain methods from
//this module are mocked in some tests but the original is required for other tests
const actualAuth = (
  await vi.importActual<typeof import('./public-auth-service.js')>(
    './public-auth-service.js',
  )
).publicAuth;

//In utils-service mock only those methods that make calls to remote services
//(for all other methods in this module keep the original implementation)
vi.mock(import('./utils-service.js'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    utils: {
      ...actual.utils,
      getOidcDiscovery: vi.fn(),
      getKeycloakPublicKey: vi.fn(),
    },
  };
});

vi.mock(import('../../config/config.js'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    config: {
      ...actual.config,
      get: (key) => {
        const settings = {
          'oidc:clientId': 'clientId',
          'tokenGenerate:issuer': 'issuer',
          'server:frontend': 'server-frontend',
          'tokenGenerate:audience': 'audience',
          'tokenGenerate:privateKey': actual.config.get(
            'tokenGenerate:privateKey',
          ),
        };
        return settings[key];
      },
    },
  };
});

describe('isTokenExpired', () => {
  describe('when the token is expired', () => {
    it('correctly identifies the expired token', () => {
      //Create a token that expired 1 hour ago
      const expiredToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '-1h',
      });

      expect(publicAuth.isTokenExpired(expiredToken)).toBeTruthy();
    });
  });
  describe('when the token has not yet expired', () => {
    it('correctly identifies that the token is still valid', () => {
      //Create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });

      expect(publicAuth.isTokenExpired(validToken)).toBeFalsy();
    });
  });
});

describe('isRenewable', () => {
  describe('when the token is expired', () => {
    it("correctly identifies that the token isn't renewable", () => {
      //Create a token that expired 1 hour ago
      const expiredToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '-1h',
      });

      expect(publicAuth.isRenewable(expiredToken)).toBeFalsy();
    });
  });
  describe('when the token has an expiration date in the future', () => {
    it('correctly identifies that the token is renewable', () => {
      //create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });

      expect(publicAuth.isRenewable(validToken)).toBeTruthy();
    });
  });
});

describe('renew', () => {
  describe('when the identify provider successfully refreshes the tokens', () => {
    it('responds with an object containing three new tokens (access, id and refresh)', async () => {
      //Mock the call made by auth.renew(...) to utils.getOidcDiscovery(...) so it doesn't
      //depend on a remote service.  The mocked return value must include a "token_endpoint"
      //property, but the value of that property isn't important because
      //we're also mocking the HTTP request (see below) that uses the return value
      const mockGetOidcDiscoveryResponse = { token_endpoint: null };
      vi.mocked(utils.getOidcDiscovery).mockResolvedValueOnce(
        mockGetOidcDiscoveryResponse,
      );

      //Mock the HTTP post request made by auth.renew(...) to the identify provider to
      //refresh the token.  The mock function implementation is to ensure this test
      //doesn't depend on a remote service.
      const mockSuccessfulRefreshTokenResponse = {
        data: {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          id_token: 'new_id_token',
        },
      };
      vi.mocked(axios.post).mockResolvedValueOnce(
        mockSuccessfulRefreshTokenResponse,
      );

      //We don't need a real refresh token because we're mocking the call to the
      //identify provider
      const dummyRefreshToken = 'old_refresh_token';

      vi.mocked(publicAuth.renew).mockImplementationOnce(actualAuth.renew);

      const result = await publicAuth.renew(dummyRefreshToken);

      //Confirm that the auth.renew(...) function returns a response object
      //with the expected properties
      expect(result.jwt).toBe(
        mockSuccessfulRefreshTokenResponse.data.access_token,
      );
      expect(result.refreshToken).toBe(
        mockSuccessfulRefreshTokenResponse.data.refresh_token,
      );
      expect(result.idToken).toBe(
        mockSuccessfulRefreshTokenResponse.data.id_token,
      );
    });
  });
  describe('when the request to the identify provider to refresh the token causes an error to be thrown', () => {
    it('responds with data from the error', async () => {
      //Mock the call made by publicAuth.renew(...) to utils.getOidcDiscovery(...) so it doesn't
      //depend on a remote service.  The mocked return value must include a "token_endpoint"
      //property, but the value of that property isn't important because
      //we're also mocking the HTTP request (see below) that uses the return value
      const mockGetOidcDiscoveryResponse = { token_endpoint: null };
      vi.mocked(utils.getOidcDiscovery).mockResolvedValueOnce(
        mockGetOidcDiscoveryResponse,
      );

      //Mock the HTTP post request made by auth.renew(...) to the identify provider to
      //refresh the token.  The mock function implementation is to ensure this test
      //doesn't depend on a remote service.
      const mockError = {
        message: 'something went wrong',
        response: { data: 'some data' },
      };
      vi.mocked(axios.post).mockImplementationOnce((url: string) => {
        throw mockError;
      });

      //We don't need a real refresh token because we're mocking the call to the
      //identify provider
      const dummyRefreshToken = 'dummy_refresh_token';

      //Use the "actual" auth.renew implementation for this test
      publicAuth.renew = vi.fn().mockImplementationOnce(actualAuth.renew);

      const result = await publicAuth.renew(dummyRefreshToken);

      //Confirm that the auth.renew(...) function returns the data from the error
      //thrown by the the mock HTTP request to the identify provider
      expect(result).toBe(mockError.response && mockError.response.data);
    });
  });
  describe('when the request to the identify provider returns an unexpected response', () => {
    it('responds with an empty object (without new tokens)', async () => {
      //Mock the call made by auth.renew(...) to utils.getOidcDiscovery(...) so it doesn't
      //depend on a remote service.  The mocked return value must include a "token_endpoint"
      //property, but the value of that property isn't important because
      //we're also mocking the HTTP request (see below) that uses the return value
      const mockGetOidcDiscoveryResponse = { token_endpoint: null };
      vi.mocked(utils.getOidcDiscovery).mockResolvedValueOnce(
        mockGetOidcDiscoveryResponse,
      );

      //Mock the HTTP post request made by auth.renew(...) to the identify provider to
      //refresh the token.  The mock function implementation is to ensure this test
      //doesn't depend on a remote service.
      const mockUnexpectedRefreshTokenResponse = {
        unexpectedResponse: 'foobar',
      };
      vi.mocked(axios.post).mockResolvedValueOnce(
        mockUnexpectedRefreshTokenResponse,
      );

      //We don't need a real refresh token because we're mocking the call to the
      //identify provider
      const dummyRefreshToken = 'old_refresh_token';

      publicAuth.renew = vi.fn().mockImplementationOnce(actualAuth.renew);

      const result = await publicAuth.renew(dummyRefreshToken);

      //Confirm that the auth.renew(...) function returns a response object
      //with the expected properties
      expect(result).toStrictEqual({});
    });
  });
});

describe('refreshJWT', () => {
  describe('when the request has no existing (backend) access token', () => {
    it('deletes the user from the request parameter object', async () => {
      const req: any = {
        user: {
          thisUserHasNoBackendAccessToken: null,
        },
      };
      const res: any = {};
      const next: any = vi.fn();
      await publicAuth.refreshJWT(req, res, next);

      //The user from the request object should have been deleted
      expect(req.user).toBeUndefined();

      //The 'next' function should have been called
      expect(next).toHaveBeenCalledTimes(1);

      //No request was issued to renew a token
      expect(publicAuth.renew).toHaveBeenCalledTimes(0);
    });
  });
  describe("when the request has an existing (backend) access token, but it's not expired yet", () => {
    it('does nothing', async () => {
      const oldAccessToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });
      const req: any = {
        user: {
          jwt: oldAccessToken,
        },
      };

      //We keep a clone of the 'req' object's original values so we can
      //detect whether refresJWT(...) changed the object in any way
      const originalReq = JSON.parse(JSON.stringify(req));

      const res: any = {};
      const next: any = vi.fn();
      await publicAuth.refreshJWT(req, res, next);

      //No change to the req parameter
      expect(req).toStrictEqual(originalReq);

      //The 'next' function should have been called
      expect(next).toHaveBeenCalledTimes(1);

      //No request was issued to renew a token
      expect(publicAuth.renew).toHaveBeenCalledTimes(0);
    });
  });
});

describe('generateUiToken', () => {
  it('generates a new JWT token that expires in 30 minute (1800 seconds)', async () => {
    const token = publicAuth.generateFrontendToken();
    const payload: any = jsonwebtoken.decode(token);

    const nowSeconds = Date.now().valueOf() / 1000;
    const ttlSeconds = payload.exp - nowSeconds;

    const expectedTtlSeconds = 1800; //30 minutes
    const ttlToleranceSeconds = 5;

    //Because a small (but non-zero) amount of time elapsed between when
    //the token was generated and when its expiration date was checked, we
    //must expect the time-to-live (TTL) to be slightly less than 30 minutes.
    //Check that the TTL is within a small tolerance of the expected TTL.
    expect(ttlSeconds).toBeLessThanOrEqual(expectedTtlSeconds);
    expect(ttlSeconds).toBeGreaterThanOrEqual(
      expectedTtlSeconds - ttlToleranceSeconds,
    );
  });
});

describe('isValidBackendToken', () => {
  describe("when there is a backend access token stored in the session and the token's signature is valid", () => {
    it('calls next() and then returns without changing the response status', async () => {
      const secret = 'secret';

      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      utils.getKeycloakPublicKey = vi.fn().mockResolvedValueOnce(secret);
      const backendAccessToken = jsonwebtoken.sign(
        {
          identity_provider: 'bceidbusiness',
          aud: 'clientId',
        },
        secret,
        { expiresIn: '1h' },
      );
      const req: any = {
        session: {
          passport: {
            user: {
              jwt: backendAccessToken,
            },
          },
        },
      };
      const res: any = {
        status: vi.fn().mockImplementation((val: any) => {
          return { json: vi.fn() };
        }),
      };
      const next: any = vi.fn();
      await publicAuth.isValidBackendToken()(req, res, next);

      expect(res.status).toHaveBeenCalledTimes(0);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
  describe('when there is a backend access token stored in the session but the token is invalid', () => {
    it('sets an HTTP status in the response parameter object', async () => {
      const secret = 'secret';

      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      vi.mocked(utils.getKeycloakPublicKey).mockResolvedValueOnce(secret);

      const backendAccessToken = 'fake token';

      const req: any = {
        session: {
          passport: {
            user: {
              jwt: backendAccessToken,
            },
          },
        },
      };
      const res: any = {
        status: vi.fn().mockImplementation((val: any) => {
          return { json: vi.fn() };
        }),
      };
      const next: any = vi.fn();
      await publicAuth.isValidBackendToken()(req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(0);
    });
  });
  describe('when the session does not contain a backend access token', () => {
    it('sets an HTTP status in the response parameter object', async () => {
      const secret = 'secret';

      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      vi.mocked(utils.getKeycloakPublicKey).mockResolvedValueOnce(secret);

      const req: any = {};
      const res: any = {
        status: vi.fn().mockImplementation((val: any) => {
          return { json: vi.fn() };
        }),
      };
      const next: any = vi.fn();
      await publicAuth.isValidBackendToken()(req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(0);
    });
  });
  describe('when the the public key of the identify provider cannot be determined', () => {
    it('sets an HTTP status in the response parameter object', async () => {
      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      vi.mocked(utils.getKeycloakPublicKey).mockReturnValueOnce(null);

      const req: any = {};
      const res: any = {
        status: vi.fn().mockImplementation((val: any) => {
          return { json: vi.fn() };
        }),
      };
      const next: any = vi.fn();
      await publicAuth.isValidBackendToken()(req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(0);
    });
  });
});

//prepare some data for below test cases.
const mockCompanyInSession = {
  legalName: 'Test Company',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 200',
  city: 'Victoria',
  province: 'BC',
  country: 'Canada',
  postal: 'V8V 4K9',
};
const mockCompanyInDB = {
  company_id: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
  bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
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
} as pay_transparency_user;
// Arrange
const userInfo = {
  jwt: 'validJwt',
  _json: {
    bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
    bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
    display_name: 'Test User',
  },
};
const req: any = {
  session: {
    companyDetails: {
      ...mockCompanyInSession,
    },
    passport: {
      user: {
        ...userInfo,
      },
    },
  },
};

describe('storeUserInfo', () => {
  it('should throw an error if no session data', async () => {
    await expect(publicAuth.storeUserInfo({} as any, {})).rejects.toThrow(
      'No session data',
    );
  });

  it('should call updatePayTransparencyCompany and updatePayTransparencyUser if session data is present and data is stored in DB', async () => {
    // when findFirst is called on mock, it will return the mock objects.
    prisma.pay_transparency_company.findFirst.mockResolvedValueOnce(
      mockCompanyInDB,
    );
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce(mockUserInDB);
    await publicAuth.storeUserInfo(mockCompanyInSession, userInfo);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.update).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.update).toHaveBeenCalled();
    expect(prisma.company_history.create).toHaveBeenCalled();
  });

  it('should call createPayTransparencyCompany and createPayTransparencyUser if session data is present and data is not present in DB', async () => {
    // when findFirst is called on mock, it will return the mock objects.

    prisma.pay_transparency_company.findFirst.mockResolvedValueOnce(undefined);
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce(undefined);
    await publicAuth.storeUserInfo(mockCompanyInSession, userInfo);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.create).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.create).toHaveBeenCalled();
    expect(prisma.company_history.create).not.toHaveBeenCalled();
  });
  it('should throw error if db transaction fails', async () => {
    // when findFirst is called on mock, it will return the mock objects.
    prisma.pay_transparency_company.findFirst.mockResolvedValueOnce(undefined);
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce(undefined);
    prisma.pay_transparency_user.create.mockRejectedValue(
      'DB transaction failed',
    );
    await expect(publicAuth.storeUserInfo(req, userInfo)).rejects.toThrow(
      'Error while storing user info',
    );

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.create).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.create).toHaveBeenCalled();
  });
});

describe('handleCallBackBusinessBceid', () => {
  const res: any = {
    redirect: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  beforeEach(() => {
    vi.spyOn(jsonwebtoken, 'decode').mockReturnValue({
      bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3',
      bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2',
      display_name: 'Test User',
      aud: 'clientId',
      identity_provider: 'bceidbusiness',
    });
  });
  it('should handle the callback successfully', async () => {
    const result = await publicAuth.handleCallBackBusinessBceid(req);

    expect(result).toBe(LogoutReason.Login);
    expect(req.session.companyDetails).toStrictEqual(mockCompanyInSession);
  });

  it('should Add the company details to session if it is not present  and add it to db', async () => {
    vi.spyOn(bceidService, 'getCompanyDetails').mockImplementation(() => {
      return Promise.resolve(mockCompanyInSession);
    });

    prisma.pay_transparency_company.findFirst.mockResolvedValueOnce(
      mockCompanyInDB,
    );
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce(mockUserInDB);
    const modifiedReq: any = {
      ...req,
    };
    modifiedReq.session.companyDetails = undefined;
    const result = await publicAuth.handleCallBackBusinessBceid(modifiedReq);
    expect(result).toBe(LogoutReason.Login);
    expect(req.session.companyDetails).toStrictEqual(mockCompanyInSession);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.update).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.update).toHaveBeenCalled();
    expect(prisma.company_history.create).toHaveBeenCalled();
  });

  it('should redirect to error if db call was error', async () => {
    vi.spyOn(bceidService, 'getCompanyDetails').mockImplementation(() => {
      return Promise.resolve(mockCompanyInSession);
    });
    prisma.pay_transparency_company.findFirst.mockResolvedValueOnce(
      mockCompanyInDB,
    );
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce(mockUserInDB);
    prisma.pay_transparency_company.update.mockRejectedValueOnce(
      'DB transaction failed',
    );
    const modifiedReq = {
      ...req,
    };
    modifiedReq.session.companyDetails = undefined;
    const result = await publicAuth.handleCallBackBusinessBceid(modifiedReq);
    expect(result).toBe(LogoutReason.LoginError);
    expect(req.session.companyDetails).toBeUndefined();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.update).toHaveBeenCalled();
    expect(prisma.company_history.create).toHaveBeenCalled();
  });

  it('should redirect to error if not all company details exist', async () => {
    const mockCompanyInSessionMissingData = {
      ...mockCompanyInSession,
      city: '',
    };
    vi.spyOn(bceidService, 'getCompanyDetails').mockImplementation(() => {
      return Promise.resolve(mockCompanyInSessionMissingData);
    });
    prisma.pay_transparency_company.findFirst.mockResolvedValueOnce(
      mockCompanyInDB,
    );
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce(mockUserInDB);
    prisma.pay_transparency_company.update.mockRejectedValueOnce(
      'DB transaction failed',
    );
    const modifiedReq = {
      ...req,
    };
    modifiedReq.session.companyDetails = undefined;
    const result = await publicAuth.handleCallBackBusinessBceid(modifiedReq);
    expect(result).toBe(LogoutReason.ContactError);
    expect(req.session.companyDetails).toBeUndefined();
    expect(prisma.$transaction).toHaveBeenCalledTimes(0);
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalledTimes(0);
    expect(prisma.pay_transparency_company.update).toHaveBeenCalledTimes(0);
  });
});

describe('isCompanyDetailsEqual', () => {
  it('should return true if details are identical', () => {
    expect(
      publicAuth.isCompanyDetailsEqual(mockCompanyInDB, mockCompanyInDB),
    ).toBeTruthy();
  });
  it('should return false if any of the details are different', () => {
    expect(
      publicAuth.isCompanyDetailsEqual(mockCompanyInDB, {
        ...mockCompanyInDB,
        address_line1: 'different',
      }),
    ).toBeFalsy();
    expect(
      publicAuth.isCompanyDetailsEqual(mockCompanyInDB, {
        ...mockCompanyInDB,
        address_line2: 'different',
      }),
    ).toBeFalsy();
    expect(
      publicAuth.isCompanyDetailsEqual(mockCompanyInDB, {
        ...mockCompanyInDB,
        city: 'different',
      }),
    ).toBeFalsy();
    expect(
      publicAuth.isCompanyDetailsEqual(mockCompanyInDB, {
        ...mockCompanyInDB,
        company_name: 'different',
      }),
    ).toBeFalsy();
    expect(
      publicAuth.isCompanyDetailsEqual(mockCompanyInDB, {
        ...mockCompanyInDB,
        country: 'different',
      }),
    ).toBeFalsy();
    expect(
      publicAuth.isCompanyDetailsEqual(mockCompanyInDB, {
        ...mockCompanyInDB,
        postal_code: 'different',
      }),
    ).toBeFalsy();
    expect(
      publicAuth.isCompanyDetailsEqual(mockCompanyInDB, {
        ...mockCompanyInDB,
        province: 'different',
      }),
    ).toBeFalsy();
  });
});

describe('companyDetailsToRecord', () => {
  it('should return a pay_transparency_company record', () => {
    const record = publicAuth.companyDetailsToRecord(mockCompanyInSession);

    expect(record.bceid_business_guid).toBeNull();
    expect(record.company_id).toBeNull();
    expect(record.address_line1).toBe(mockCompanyInSession.addressLine1);
    expect(record.address_line2).toBe(mockCompanyInSession.addressLine2);
    expect(record.city).toBe(mockCompanyInSession.city);
    expect(record.company_name).toBe(mockCompanyInSession.legalName);
    expect(record.country).toBe(mockCompanyInSession.country);
    expect(record.postal_code).toBe(mockCompanyInSession.postal);
    expect(record.province).toBe(mockCompanyInSession.province);
    expect(record.create_date).toBeNull();
    expect(record.update_date).toBeNull();
  });
});
