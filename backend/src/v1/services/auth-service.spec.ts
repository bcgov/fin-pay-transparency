import axios from 'axios';
import jsonwebtoken from 'jsonwebtoken';
import { config } from '../../config';
import { auth } from './auth-service';
import { utils } from './utils-service';
import prisma from '../prisma/prisma-client';
import * as bceidService from '../../external/services/bceid-service';
//Mock the entire axios module so we never inadvertently make real
//HTTP calls to remote services
jest.mock('axios');

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
    $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
  };
});
//Mock only the renew method in auth-service (for all other methods
//in this module keep the original implementation)
jest.mock('./auth-service', () => {
  const actualAuth = jest.requireActual('./auth-service').auth;
  const mockedAuth = (jest.genMockFromModule('./auth-service') as any).auth;

  return {
    auth: {
      ...mockedAuth,
      ...actualAuth,
      renew: jest.fn((refreshToken) => {}),
    },
  };
});

//Keep a copy of the non-mocked auth-service because certain methods from
//this module are mocked in some tests byt the original is required for other tests
const actualAuth = jest.requireActual('./auth-service').auth;

//In utils-service mock only those methods that make calls to remote services
//(for all other methods in this module keep the original implementation)
jest.mock('./utils-service', () => {
  const actualUtils = jest.requireActual('./utils-service').utils;
  return {
    utils: {
      ...actualUtils,
      getOidcDiscovery: jest.fn(),
      getKeycloakPublicKey: jest.fn(),
    },
  };
});

jest.mock('../../config');
const actualConfig = jest.requireActual('../../config').config;

afterEach(() => {
  jest.clearAllMocks();
});

describe('isTokenExpired', () => {
  describe('when the token is expired', () => {
    it('correctly identifies the expired token', () => {
      //Create a token that expired 1 hour ago
      const expiredToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '-1h',
      });

      expect(auth.isTokenExpired(expiredToken)).toBeTruthy();
    });
  });
  describe('when the token has not yet expired', () => {
    it('correctly identifies that the token is still valid', () => {
      //Create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });

      expect(auth.isTokenExpired(validToken)).toBeFalsy();
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

      expect(auth.isRenewable(expiredToken)).toBeFalsy();
    });
  });
  describe('when the token has an expiration date in the future', () => {
    it('correctly identifies that the token is renewable', () => {
      //create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign({ data: 'payload' }, 'secret', {
        expiresIn: '1h',
      });

      expect(auth.isRenewable(validToken)).toBeTruthy();
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
      (utils.getOidcDiscovery as jest.Mock).mockResolvedValueOnce(
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
      (axios.post as jest.Mock).mockResolvedValueOnce(
        mockSuccessfulRefreshTokenResponse,
      );

      //We don't need a real refresh token because we're mocking the call to the
      //identify provider
      const dummyRefreshToken = 'old_refresh_token';

      (auth.renew as jest.Mock).mockImplementationOnce(actualAuth.renew);

      const result = await auth.renew(dummyRefreshToken);

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
      //Mock the call made by auth.renew(...) to utils.getOidcDiscovery(...) so it doesn't
      //depend on a remote service.  The mocked return value must include a "token_endpoint"
      //property, but the value of that property isn't important because
      //we're also mocking the HTTP request (see below) that uses the return value
      const mockGetOidcDiscoveryResponse = { token_endpoint: null };
      (utils.getOidcDiscovery as jest.Mock).mockResolvedValueOnce(
        mockGetOidcDiscoveryResponse,
      );

      //Mock the HTTP post request made by auth.renew(...) to the identify provider to
      //refresh the token.  The mock function implementation is to ensure this test
      //doesn't depend on a remote service.
      const mockError = {
        message: 'something went wrong',
        response: { data: 'some data' },
      };
      (axios.post as jest.Mock).mockImplementationOnce((url: string) => {
        throw mockError;
      });

      //We don't need a real refresh token because we're mocking the call to the
      //identify provider
      const dummyRefreshToken = 'dummy_refresh_token';

      //Use the "actual" auth.renew implementation for this test
      auth.renew = jest.fn().mockImplementationOnce(actualAuth.renew);

      const result = await auth.renew(dummyRefreshToken);

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
      (utils.getOidcDiscovery as jest.Mock).mockResolvedValueOnce(
        mockGetOidcDiscoveryResponse,
      );

      //Mock the HTTP post request made by auth.renew(...) to the identify provider to
      //refresh the token.  The mock function implementation is to ensure this test
      //doesn't depend on a remote service.
      const mockUnexpectedRefreshTokenResponse = {
        unexpectedResponse: 'foobar',
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(
        mockUnexpectedRefreshTokenResponse,
      );

      //We don't need a real refresh token because we're mocking the call to the
      //identify provider
      const dummyRefreshToken = 'old_refresh_token';

      auth.renew = jest.fn().mockImplementationOnce(actualAuth.renew);

      const result = await auth.renew(dummyRefreshToken);

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
      const next: any = jest.fn();
      await auth.refreshJWT(req, res, next);

      //The user from the request object should have been deleted
      expect(req.user).toBeUndefined();

      //The 'next' function should have been called
      expect(next).toHaveBeenCalledTimes(1);

      //No request was issued to renew a token
      expect(auth.renew).toHaveBeenCalledTimes(0);
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
      const next: any = jest.fn();
      await auth.refreshJWT(req, res, next);

      //No change to the req parameter
      expect(req).toStrictEqual(originalReq);

      //The 'next' function should have been called
      expect(next).toHaveBeenCalledTimes(1);

      //No request was issued to renew a token
      expect(auth.renew).toHaveBeenCalledTimes(0);
    });
  });
});

describe('generateUiToken', () => {
  it('generates a new JWT token that expires in 30 minute (1800 seconds)', async () => {
    (config.get as jest.Mock).mockImplementation((key) => {
      return {
        'tokenGenerate:issuer': 'issuer',
        'server:frontend': 'server-frontend',
        'tokenGenerate:audience': 'audience',
        'tokenGenerate:privateKey': actualConfig.get(
          'tokenGenerate:privateKey',
        ),
      }[key];
    });

    const token = auth.generateUiToken();
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
      utils.getKeycloakPublicKey = jest.fn().mockResolvedValueOnce(secret);
      (config.get as jest.Mock).mockImplementation((key) => {
        return {
          'oidc:clientId': 'clientId',
        }[key];
      });
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
        status: jest.fn().mockImplementation((val: any) => {
          return { json: jest.fn() };
        }),
      };
      const next: any = jest.fn();
      await auth.isValidBackendToken()(req, res, next);

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
      (utils.getKeycloakPublicKey as jest.Mock).mockResolvedValueOnce(secret);

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
        status: jest.fn().mockImplementation((val: any) => {
          return { json: jest.fn() };
        }),
      };
      const next: any = jest.fn();
      await auth.isValidBackendToken()(req, res, next);

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
      (utils.getKeycloakPublicKey as jest.Mock).mockResolvedValueOnce(secret);

      const req: any = {};
      const res: any = {
        status: jest.fn().mockImplementation((val: any) => {
          return { json: jest.fn() };
        }),
      };
      const next: any = jest.fn();
      await auth.isValidBackendToken()(req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(0);
    });
  });
  describe('when the the public key of the identify provider cannot be determined', () => {
    it('sets an HTTP status in the response parameter object', async () => {
      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      (utils.getKeycloakPublicKey as jest.Mock).mockReturnValueOnce(null);

      const req: any = {};
      const res: any = {
        status: jest.fn().mockImplementation((val: any) => {
          return { json: jest.fn() };
        }),
      };
      const next: any = jest.fn();
      await auth.isValidBackendToken()(req, res, next);

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
    await expect(auth.storeUserInfo({} as any, {})).rejects.toThrow(
      'No session data',
    );
  });

  it('should call updatePayTransparencyCompany and updatePayTransparencyUser if session data is present and data is stored in DB', async () => {
    // when findFirst is called on mock, it will return the mock objects.
    (
      prisma.pay_transparency_company.findFirst as jest.Mock
    ).mockResolvedValueOnce(mockCompanyInDB);
    (prisma.pay_transparency_user.findFirst as jest.Mock).mockResolvedValueOnce(
      mockUserInDB,
    );
    await auth.storeUserInfo(req, userInfo);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.update).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.update).toHaveBeenCalled();
  });

  it('should call createPayTransparencyCompany and createPayTransparencyUser if session data is present and data is not present in DB', async () => {
    // when findFirst is called on mock, it will return the mock objects.
    (
      prisma.pay_transparency_company.findFirst as jest.Mock
    ).mockResolvedValueOnce(undefined);
    (prisma.pay_transparency_user.findFirst as jest.Mock).mockResolvedValueOnce(
      undefined,
    );
    await auth.storeUserInfo(req, userInfo);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.create).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.create).toHaveBeenCalled();
  });
  it('should throw error if db transaction fails ', async () => {
    // when findFirst is called on mock, it will return the mock objects.
    (
      prisma.pay_transparency_company.findFirst as jest.Mock
    ).mockResolvedValueOnce(undefined);
    (prisma.pay_transparency_user.findFirst as jest.Mock).mockResolvedValueOnce(
      undefined,
    );
    (prisma.pay_transparency_user.create as jest.Mock).mockRejectedValue(
      'DB transaction failed',
    );
    await expect(auth.storeUserInfo(req, userInfo)).rejects.toThrow(
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
  (config.get as jest.Mock).mockImplementation((key) => {
    return {
      'oidc:clientId': 'clientId',
    }[key];
  });
  const res: any = {
    redirect: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  beforeEach(() => {
    jest.spyOn(jsonwebtoken, 'decode').mockReturnValue({
      bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3',
      bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2',
      display_name: 'Test User',
      aud: 'clientId',
      identity_provider: 'bceidbusiness',
    });
  });
  it('should handle the callback successfully', async () => {
    // Mock any dependencies and set up the expected behavior

    // Act
    await auth.handleCallBackBusinessBceid(req, res);

    expect(res.redirect).toHaveBeenCalled();
    expect(req.session.companyDetails).toStrictEqual(mockCompanyInSession);
    // Assert
    // Verify the function behaved as expected
  });

  it('should Add the company details to session if it is not present  and add it to db', async () => {
    jest.spyOn(bceidService, 'getCompanyDetails').mockImplementation(() => {
      return Promise.resolve(mockCompanyInSession);
    });

    (
      prisma.pay_transparency_company.findFirst as jest.Mock
    ).mockResolvedValueOnce(mockCompanyInDB);
    (prisma.pay_transparency_user.findFirst as jest.Mock).mockResolvedValueOnce(
      mockUserInDB,
    );
    const modifiedReq: any = {
      ...req,
    };
    modifiedReq.session.companyDetails = undefined;
    await auth.handleCallBackBusinessBceid(modifiedReq, res);
    expect(res.redirect).toHaveBeenCalled();
    expect(req.session.companyDetails).toStrictEqual(mockCompanyInSession);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.update).toHaveBeenCalled();
    expect(prisma.pay_transparency_user.update).toHaveBeenCalled();
  });

  it('should redirect to error if db call was error', async () => {
    jest.spyOn(bceidService, 'getCompanyDetails').mockImplementation(() => {
      return Promise.resolve(mockCompanyInSession);
    });
    (
      prisma.pay_transparency_company.findFirst as jest.Mock
    ).mockResolvedValueOnce(mockCompanyInDB);
    (prisma.pay_transparency_user.findFirst as jest.Mock).mockResolvedValueOnce(
      mockUserInDB,
    );
    (prisma.pay_transparency_company.update as jest.Mock).mockRejectedValueOnce(
      'DB transaction failed',
    );
    const modifiedReq = {
      ...req,
    };
    modifiedReq.session.companyDetails = undefined;
    await auth.handleCallBackBusinessBceid(modifiedReq, res);
    expect(res.redirect).toHaveBeenCalled();
    expect(req.session.companyDetails).toStrictEqual(mockCompanyInSession);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.findFirst).toHaveBeenCalled();
    expect(prisma.pay_transparency_company.update).toHaveBeenCalled();
  });
});
