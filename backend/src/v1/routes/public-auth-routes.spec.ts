import express, { Application } from 'express';
import request from 'supertest';
import { MISSING_COMPANY_DETAILS_ERROR } from '../../constants';
import { authUtils } from '../services/auth-utils-service';
import { LogoutReason } from '../services/public-auth-service';
import router from './public-auth-routes';
let app: Application;

const mockHandleCallbackBusinessBceid = jest.fn();
const mockIsTokenExpired = jest.fn();
const mockIsRenewable = jest.fn();
const mockRenew = jest.fn();
const mockGenerateUiToken = jest.fn();
jest.mock('../services/public-auth-service', () => {
  const actualPublicAuth = jest.requireActual(
    '../services/public-auth-service',
  );
  return {
    publicAuth: {
      ...actualPublicAuth.publicAuth,
      handleCallBackBusinessBceid: (...args) =>
        mockHandleCallbackBusinessBceid(...args),
      refreshJWT: jest.fn((req, res, next) => mockRefreshJWT(req, res, next)),
      isTokenExpired: () => mockIsTokenExpired(),
      isRenewable: () => mockIsRenewable(),
      renew: () => mockRenew(),
      generateUiToken: () => mockGenerateUiToken(),
      renewBackendAndFrontendTokens: (req, res) => {
        return authUtils.renewBackendAndFrontendTokens(
          req,
          res,
          mockRenew,
          mockGenerateUiToken,
        );
      },
    },
    LogoutReason: actualPublicAuth.LogoutReason,
  };
});

const mockGetOidcDiscovery = jest.fn();
jest.mock('../services/utils-service', () => ({
  ...jest.requireActual('../services/utils-service'),
  utils: {
    ...jest.requireActual('../services/utils-service').utils,
    getOidcDiscovery: (...args) => mockGetOidcDiscovery(...args),
  },
}));

const mockAuthenticate = jest.fn();
const mockRefreshJWT = jest.fn();
jest.mock('passport', () => ({
  authenticate: (...args) =>
    jest.fn((req, res, next) => mockAuthenticate(req, res, next)),
}));

const mockExists = jest.fn();
const mockValidationResult = jest.fn();
jest.mock('express-validator', () => ({
  ...jest.requireActual('express-validator'),
  body: (...args) => ({
    exists: () => jest.fn((req, res, next) => mockExists(req, res, next)),
  }),
  validationResult: jest.fn(() => mockValidationResult()),
}));

const mockLogout = jest.fn();
const mockRequest = {
  logout: jest.fn(mockLogout),
  session: {
    destroy: jest.fn(),
  },
  user: {
    idToken: 'ey....',
  },
};

describe('public-auth-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('', router);
  });

  describe('/callback_business_bceid [GET]', () => {
    it('should redirect to frontend if successful', () => {
      mockAuthenticate.mockImplementation((_, __, next) => {
        next();
      });

      mockHandleCallbackBusinessBceid.mockImplementation((req) => {
        return LogoutReason.Login;
      });

      return request(app).get('/callback_business_bceid').expect(302);
    });
    it('should log out if error', () => {
      mockLogout.mockImplementation((cb) => cb());
      mockGetOidcDiscovery.mockResolvedValue({
        end_session_endpoint: 'http://test.com/',
      });
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);
      mockAuthenticate.mockImplementation((_, __, next) => {
        next();
      });

      mockHandleCallbackBusinessBceid.mockImplementation((req) => {
        return LogoutReason.ContactError;
      });

      return request(app).get('/auth/callback_business_bceid').expect(302);
    });
  });

  describe('/error [GET]', () => {
    it('should redirect to frontend /login-error', () => {
      return request(app).get('/error').expect(302);
    });
  });

  describe('/logout', () => {
    it('should successfully logout', () => {
      mockLogout.mockImplementation((cb) => cb());
      mockGetOidcDiscovery.mockResolvedValue({
        end_session_endpoint: 'http://test.com/',
      });
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app).get('/auth/logout').expect(302);
    });

    it('should handle session expired', () => {
      mockLogout.mockImplementation((cb) => cb());
      mockGetOidcDiscovery.mockResolvedValue({
        end_session_endpoint: 'http://test.com/',
      });
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .get('/auth/logout')
        .query({ sessionExpired: true })
        .expect(302);
    });
    it('should handle contact error', () => {
      mockLogout.mockImplementation((cb) => cb());
      mockGetOidcDiscovery.mockResolvedValue({
        end_session_endpoint: 'http://test.com/',
      });
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .get('/auth/logout')
        .query({ contactError: true })
        .expect(302);
    });
    it('should handle loginBceid', () => {
      mockLogout.mockImplementation((cb) => cb());
      mockGetOidcDiscovery.mockResolvedValue({
        end_session_endpoint: 'http://test.com/',
      });
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .get('/auth/logout')
        .query({ loginBceid: true })
        .expect(302);
    });
    it('should handle login error', () => {
      mockLogout.mockImplementation((cb) => cb());
      mockGetOidcDiscovery.mockResolvedValue({
        end_session_endpoint: 'http://test.com/',
      });
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .get('/auth/logout')
        .query({ loginError: true })
        .expect(302);
    });
    it('should handle user idToken not found', () => {
      mockLogout.mockImplementation((cb) => cb());
      mockGetOidcDiscovery.mockResolvedValue({
        end_session_endpoint: 'http://test.com/',
      });
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .get('/auth/logout')
        .query({ loginError: true })
        .expect(302);
    });
    it('should handle logout error', () => {
      mockLogout.mockImplementation((cb) => cb('Error'));
      mockGetOidcDiscovery.mockResolvedValue({
        end_session_endpoint: 'http://test.com/',
      });
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);
      const errorHandler = jest.fn();
      app.use((error, req, res, next) => {
        errorHandler(error);
        return res.status(400).json({});
      });

      return request(app)
        .get('/auth/logout')
        .query({ loginError: true })
        .expect(400)
        .then(() => {
          expect(errorHandler).toHaveBeenCalled();
        });
    });
  });

  describe('/refresh', () => {
    it('return 401 if token company details are missing', () => {
      mockExists.mockImplementation((req, res, next) => next());
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .post('/auth/refresh')
        .expect(401)
        .expect((res) => {
          expect(res.body.error).toBe(MISSING_COMPANY_DETAILS_ERROR);
        });
    });
    it('should handle validation errors', () => {
      mockExists.mockImplementation((req, res, next) => next());
      mockValidationResult.mockImplementation(() => {
        return {
          isEmpty: () => false,
          array: () => [1, 2],
        };
      });
      app.use((req: any, res, next) => {
        req.session = { ...mockRequest.session, companyDetails: { id: 1 } };
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .post('/auth/refresh')
        .expect(400)
        .expect((res) => {
          expect(res.body.errors).toEqual([1, 2]);
        });
    });
    it('should return unauthorized when jwt or refresh token is not found', () => {
      mockExists.mockImplementation((req, res, next) => next());
      mockValidationResult.mockImplementation(() => {
        return {
          isEmpty: () => true,
        };
      });
      app.use((req: any, res, next) => {
        req.session = { ...mockRequest.session, companyDetails: { id: 1 } };
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .post('/auth/refresh')
        .expect(401)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Unauthorized',
            error_description: 'Not logged in',
          });
        });
    });
    it('should renew the token if renewable', () => {
      mockExists.mockImplementation((req, res, next) => next());
      mockValidationResult.mockImplementation(() => {
        return {
          isEmpty: () => true,
        };
      });
      mockIsTokenExpired.mockReturnValue(true);
      mockGenerateUiToken.mockReturnValue('jwt_value');
      mockIsRenewable.mockReturnValue(true);
      mockRenew.mockResolvedValue({ jwt: 1, refreshToken: 1 });

      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          companyDetails: { id: 1 },
          correlationID: 12,
        };
        req.user = { ...mockRequest.user, jwt: 'jwt', refreshToken: 'jwt' };
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .post('/auth/refresh')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            jwtFrontend: 'jwt_value',
            correlationID: 12,
          });
        });
    });
    it('should return unauthorized when it fails to renew tokens', () => {
      mockExists.mockImplementation((req, res, next) => next());
      mockValidationResult.mockImplementation(() => {
        return {
          isEmpty: () => true,
        };
      });
      mockIsTokenExpired.mockReturnValue(true);
      mockGenerateUiToken.mockReturnValue('jwt_value');
      mockIsRenewable.mockReturnValue(true);
      mockRenew.mockResolvedValue({});

      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          companyDetails: { id: 1 },
          correlationID: 12,
        };
        req.user = { ...mockRequest.user, jwt: 'jwt', refreshToken: 'jwt' };
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app).post('/auth/refresh').expect(401);
    });
    it('should return unauthorized if token is not expired', () => {
      mockExists.mockImplementation((req, res, next) => next());
      mockValidationResult.mockImplementation(() => {
        return {
          isEmpty: () => true,
        };
      });
      mockIsTokenExpired.mockReturnValue(true);
      mockIsRenewable.mockReturnValue(false);

      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          companyDetails: { id: 1 },
          correlationID: 12,
        };
        req.user = { ...mockRequest.user, jwt: 'jwt', refreshToken: 'jwt' };
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app).post('/auth/refresh').expect(401);
    });
    it('should return with current user tokens', () => {
      mockExists.mockImplementation((req, res, next) => next());
      mockValidationResult.mockImplementation(() => {
        return {
          isEmpty: () => true,
        };
      });
      mockIsTokenExpired.mockReturnValue(false);

      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          companyDetails: { id: 1 },
          correlationID: 12,
        };
        req.user = {
          ...mockRequest.user,
          jwtFrontend: 'jwt',
          jwt: 'jwt',
          refreshToken: 'jwt',
        };
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .post('/auth/refresh')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            jwtFrontend: 'jwt',
            correlationID: 12,
          });
        });
    });
  });
  describe('/token', () => {
    it('return 401 if token company details are missing', () => {
      mockRefreshJWT.mockImplementation((req, res, next) => next());
      mockExists.mockImplementation((req, res, next) => next());
      app.use((req: any, res, next) => {
        req.session = mockRequest.session;
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .get('/auth/token')
        .expect(401)
        .expect((res) => {
          expect(res.body.error).toBe(MISSING_COMPANY_DETAILS_ERROR);
        });
    });
    it('return 200 if jwtFrontend and refreshToken are available', () => {
      mockRefreshJWT.mockImplementation((req, res, next) => next());
      mockExists.mockImplementation((req, res, next) => next());
      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          correlationID: 1,
          companyDetails: {},
          passport: {
            user: {
              _json: {},
            },
          },
        };
        req.user = {
          ...mockRequest.user,
          jwtFrontend: 'jwtFrontend',
          refreshToken: 'refreshToken',
        };
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .get('/auth/token')
        .expect(200)
        .expect((res) => {
          expect(res.body.jwtFrontend).toBeDefined();
          expect(res.body.correlationID).toBeDefined();
        });
    });
    it('return 401 unauthorized', () => {
      mockRefreshJWT.mockImplementation((req, res, next) => next());
      mockExists.mockImplementation((req, res, next) => next());
      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          correlationID: 1,
          companyDetails: {},
        };
        req.user = {
          ...mockRequest.user,
        };
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app)
        .get('/auth/token')
        .expect(401)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Unauthorized',
            error_description: 'Not logged in',
          });
        });
    });
  });
});
