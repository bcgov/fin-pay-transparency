import axios from 'axios';
import jsonwebtoken from 'jsonwebtoken';
import { auth } from './auth-service';
import { utils } from './utils-service';

//Mock the entire axios module so we never inadvertently make real 
//HTTP calls to remote services
jest.mock('axios');

//Mock only the renew method in auth-service (for all other methods
//in this module keep the original implementation)
jest.mock('./auth-service', () => {
  const actualAuth = jest.requireActual('./auth-service').auth
  const mockedAuth = (jest.genMockFromModule('./auth-service') as any).auth;

  return {
    auth: {
      ...mockedAuth,
      ...actualAuth,
      renew: jest.fn((refreshToken) => { })
    }
  }
})

//Keep a copy of the non-mocked auth-service because certain methods from
//this module are mocked in some tests byt the original is required for other tests
const actualAuth = jest.requireActual('./auth-service').auth

//In utils-service mock only those methods that make calls to remote services
//(for all other methods in this module keep the original implementation)
jest.mock('./utils-service', () => {
  const actualUtils = jest.requireActual('./utils-service').utils
  return {
    utils: {
      ...actualUtils,
      getOidcDiscovery: jest.fn(),
      getKeycloakPublicKey: jest.fn(),
    }
  }
})

afterEach(() => {
  jest.clearAllMocks();
});

describe("isTokenExpired", () => {
  describe("when the token is expired", () => {
    it("correctly identifies the expired token", () => {
      //Create a token that expired 1 hour ago
      const expiredToken = jsonwebtoken.sign(
        { data: 'payload' },
        'secret',
        { expiresIn: '-1h' });

      expect(auth.isTokenExpired(expiredToken)).toBeTruthy();
    })
  })
  describe("when the token has not yet expired", () => {
    it("correctly identifies that the token is still valid", () => {
      //Create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign(
        { data: 'payload' },
        'secret',
        { expiresIn: '1h' });

      expect(auth.isTokenExpired(validToken)).toBeFalsy();
    })
  })
})

describe("isRenewable", () => {
  describe("when the token is expired", () => {
    it("correctly identifies that the token isn't renewable", () => {
      //Create a token that expired 1 hour ago
      const expiredToken = jsonwebtoken.sign(
        { data: 'payload' },
        'secret',
        { expiresIn: '-1h' });

      expect(auth.isRenewable(expiredToken)).toBeFalsy();
    })
  })
  describe("when the token has an expiration date in the future", () => {
    it("correctly identifies that the token is renewable", () => {
      //create a token that expires in 1 hour
      const validToken = jsonwebtoken.sign(
        { data: 'payload' },
        'secret',
        { expiresIn: '1h' });

      expect(auth.isRenewable(validToken)).toBeTruthy();
    })
  })
})

describe("renew", () => {
  describe("when the identify provider successfully refreshes the tokens", () => {
    it("responds with an object containing three new tokens (access, id and refresh)", async () => {

      //Mock the call made by auth.renew(...) to utils.getOidcDiscovery(...) so it doesn't
      //depend on a remote service.  The mocked return value must include a "token_endpoint"
      //property, but the value of that property isn't important because
      //we're also mocking the HTTP request (see below) that uses the return value
      const mockGetOidcDiscoveryResponse = { "token_endpoint": null };
      (utils.getOidcDiscovery as jest.Mock).mockResolvedValueOnce(mockGetOidcDiscoveryResponse);

      //Mock the HTTP post request made by auth.renew(...) to the identify provider to
      //refresh the token.  The mock function implementation is to ensure this test 
      //doesn't depend on a remote service.
      const mockSuccessfulRefreshTokenResponse = {
        data: {
          access_token: "new_access_token",
          refresh_token: "new_refresh_token",
          id_token: "new_id_token"
        }
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockSuccessfulRefreshTokenResponse);

      //We don't need a real refresh token because we're mocking the call to the 
      //identify provider
      const dummyRefreshToken = "old_refresh_token";


      (auth.renew as jest.Mock).mockImplementationOnce(actualAuth.renew);

      const result = await auth.renew(dummyRefreshToken);

      //Confirm that the auth.renew(...) function returns a response object
      //with the expected properties
      expect(result.jwt).toBe(mockSuccessfulRefreshTokenResponse.data.access_token);
      expect(result.refreshToken).toBe(mockSuccessfulRefreshTokenResponse.data.refresh_token);
      expect(result.idToken).toBe(mockSuccessfulRefreshTokenResponse.data.id_token);
    })
  })
  describe("when the request to the identify provider to refresh the token causes an error to be thrown", () => {
    it("responds with data from the error", async () => {

      //Mock the call made by auth.renew(...) to utils.getOidcDiscovery(...) so it doesn't
      //depend on a remote service.  The mocked return value must include a "token_endpoint"
      //property, but the value of that property isn't important because
      //we're also mocking the HTTP request (see below) that uses the return value
      const mockGetOidcDiscoveryResponse = { "token_endpoint": null };
      (utils.getOidcDiscovery as jest.Mock).mockResolvedValueOnce(mockGetOidcDiscoveryResponse);

      //Mock the HTTP post request made by auth.renew(...) to the identify provider to
      //refresh the token.  The mock function implementation is to ensure this test 
      //doesn't depend on a remote service.
      const mockError = { message: "something went wrong", response: { data: "some data" } };
      (axios.post as jest.Mock).mockImplementationOnce((url: string) => {
        throw mockError;
      });

      //We don't need a real refresh token because we're mocking the call to the 
      //identify provider
      const dummyRefreshToken = "dummy_refresh_token";

      //Use the "actual" auth.renew implementation for this test
      auth.renew = jest.fn().mockImplementationOnce(actualAuth.renew);

      const result = await auth.renew(dummyRefreshToken);

      //Confirm that the auth.renew(...) function returns the data from the error
      //thrown by the the mock HTTP request to the identify provider
      expect(result).toBe(mockError.response && mockError.response.data);

    })
  })
  describe("when the request to the identify provider returns an unexpected response", () => {
    it("responds with an empty object (without new tokens)", async () => {

      //Mock the call made by auth.renew(...) to utils.getOidcDiscovery(...) so it doesn't
      //depend on a remote service.  The mocked return value must include a "token_endpoint"
      //property, but the value of that property isn't important because
      //we're also mocking the HTTP request (see below) that uses the return value
      const mockGetOidcDiscoveryResponse = { "token_endpoint": null };
      (utils.getOidcDiscovery as jest.Mock).mockResolvedValueOnce(mockGetOidcDiscoveryResponse);

      //Mock the HTTP post request made by auth.renew(...) to the identify provider to
      //refresh the token.  The mock function implementation is to ensure this test 
      //doesn't depend on a remote service.
      const mockUnexpectedRefreshTokenResponse = {
        unexpectedResponse: "foobar"
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockUnexpectedRefreshTokenResponse);

      //We don't need a real refresh token because we're mocking the call to the 
      //identify provider
      const dummyRefreshToken = "old_refresh_token";

      auth.renew = jest.fn().mockImplementationOnce(actualAuth.renew);

      const result = await auth.renew(dummyRefreshToken);

      //Confirm that the auth.renew(...) function returns a response object
      //with the expected properties
      expect(result).toStrictEqual({});

    })
  })
})

describe("refreshJWT", () => {
  describe("when the request has no existing (backend) access token", () => {
    it("deletes the user from the request parameter object", async () => {

      const req = {
        user: {
          thisUserHasNoBackendAccessToken: null
        }
      };
      const res = {};
      const next = jest.fn()
      await auth.refreshJWT(req, res, next)

      //The user from the request object should have been deleted
      expect(req.user).toBeUndefined()

      //The 'next' function should have been called
      expect(next).toHaveBeenCalledTimes(1);

      //No request was issued to renew a token
      expect(auth.renew).toHaveBeenCalledTimes(0);
    })
  })
  describe("when the request has an existing (backend) access token, but it's not expired yet", () => {
    it("does nothing", async () => {

      const oldAccessToken = jsonwebtoken.sign(
        { data: 'payload' },
        'secret',
        { expiresIn: '1h' });
      const req = {
        user: {
          jwt: oldAccessToken
        }
      };

      //We keep a clone of the 'req' object's original values so we can
      //detect whether refresJWT(...) changed the object in any way
      const originalReq = JSON.parse(JSON.stringify(req));

      const res = {};
      const next = jest.fn()
      await auth.refreshJWT(req, res, next)

      //No change to the req parameter
      expect(req).toStrictEqual(originalReq)

      //The 'next' function should have been called
      expect(next).toHaveBeenCalledTimes(1);

      //No request was issued to renew a token
      expect(auth.renew).toHaveBeenCalledTimes(0);
    })
  })
})

describe("generateUiToken", () => {
  it("generates a new JWT token that expires in 30 minute (1800 seconds)", async () => {

    const token = auth.generateUiToken();
    const payload = jsonwebtoken.decode(token);

    const nowSeconds = Date.now().valueOf() / 1000;
    const ttlSeconds = payload.exp - nowSeconds;

    const expectedTtlSeconds = 1800; //30 minutes
    const ttlToleranceSeconds = 5;

    //Because a small (but non-zero) amount of time elapsed between when 
    //the token was generated and when its expiration date was checked, we 
    //must expect the time-to-live (TTL) to be slightly less than 30 minutes.  
    //Check that the TTL is within a small tolerance of the expected TTL.
    expect(ttlSeconds).toBeLessThanOrEqual(expectedTtlSeconds);
    expect(ttlSeconds).toBeGreaterThanOrEqual(expectedTtlSeconds - ttlToleranceSeconds);
  })
})

describe("getApiCredentials", () => {
  it("TODO: The method is not actually used.  Confirm it is needed before taking time to write a test", async () => {
    //expect(null).toBeTruthy();
  })
})

describe("isValidBackendToken", () => {
  describe("when there is a backend access token stored in the session and the token's signature is valid", () => {
    it("calls next() and then returns without changing the response status", async () => {

      const secret = "secret";

      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      utils.getKeycloakPublicKey = jest.fn().mockResolvedValueOnce(secret);

      const backendAccessToken = jsonwebtoken.sign(
        { data: 'payload' },
        secret,
        { expiresIn: '1h' });
      const req = {
        session: {
          passport: {
            user: {
              jwt: backendAccessToken
            }
          }
        }
      };
      const res = {
        status: jest.fn().mockImplementation((val) => { return { json: jest.fn() } })
      };
      const next = jest.fn()
      await auth.isValidBackendToken()(req, res, next)

      expect(res.status).toHaveBeenCalledTimes(0);
      expect(next).toHaveBeenCalledTimes(1);

    })
  })
  describe("when there is a backend access token stored in the session but the token is invalid", () => {
    it("sets an HTTP status in the response parameter object", async () => {

      const secret = "secret";

      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      (utils.getKeycloakPublicKey as jest.Mock).mockResolvedValueOnce(secret);

      const backendAccessToken = "fake token"

      const req = {
        session: {
          passport: {
            user: {
              jwt: backendAccessToken
            }
          }
        }
      };
      const res = {
        status: jest.fn().mockImplementation((val) => { return { json: jest.fn() } })
      };
      const next = jest.fn()
      await auth.isValidBackendToken()(req, res, next)

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(0);

    })
  })
  describe("when the session does not contain a backend access token", () => {
    it("sets an HTTP status in the response parameter object", async () => {

      const secret = "secret";

      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      (utils.getKeycloakPublicKey as jest.Mock).mockResolvedValueOnce(secret);

      const req = {
      };
      const res = {
        status: jest.fn().mockImplementation((val) => { return { json: jest.fn() } })
      };
      const next = jest.fn()
      await auth.isValidBackendToken()(req, res, next)

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(0);

    })
  })
  describe("when the the public key of the identify provider cannot be determined", () => {
    it("sets an HTTP status in the response parameter object", async () => {

      //Internally isValidBackendToken(..) makes a call to utils.getKeycloakPublicKey().  That
      //function depends on a remote service.  To remove this test's dependency on remote services
      //we instead mock utils.getKeycloakPublicKey().
      (utils.getKeycloakPublicKey as jest.Mock).mockReturnValueOnce(null)

      const req = {
      };
      const res = {
        status: jest.fn().mockImplementation((val) => { return { json: jest.fn() } })
      };
      const next = jest.fn()
      await auth.isValidBackendToken()(req, res, next)

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(0);

    })
  })
})
