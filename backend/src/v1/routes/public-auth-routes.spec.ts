import express, { Application } from 'express';
import request from 'supertest';
import { MISSING_COMPANY_DETAILS_ERROR } from '../../constants/constants';
import { LogoutReason, publicAuth } from '../services/public-auth-service';
import router from './public-auth-routes';
let app: Application;

const mockHandleCallbackBusinessBceid = jest.fn().mockResolvedValue(undefined);
const mockIsTokenExpired = jest.fn();
const mockIsRenewable = jest.fn();
const mockRenew = jest.fn();
const mockGenerateFrontendToken = jest.fn();
const mockRenewBackendAndFrontendTokens = jest.fn((req, res) => {
  res.status(200).json({});
});

jest.mock('../services/public-auth-service', () => {
  const actualPublicAuth = jest.requireActual(
    '../services/public-auth-service',
  );
  const mockedPublicAuth = jest.createMockFromModule(
    '../services/public-auth-service',
  ) as any;

  const mocked = {
    ...mockedPublicAuth,
    publicAuth: { ...actualPublicAuth.publicAuth },
  };
  mocked.publicAuth.handleCallBackBusinessBceid = (...args) => {
    mockHandleCallbackBusinessBceid(...args);
  };
  mocked.publicAuth.refreshJWT = jest.fn((req, res, next) =>
    mockRefreshJWT(req, res, next),
  );
  mocked.publicAuth.isTokenExpired = () => mockIsTokenExpired();
  mocked.publicAuth.isRenewable = () => mockIsRenewable();
  mocked.publicAuth.renew = function () {
    mockRenew();
  };
  mocked.publicAuth.generateFrontendToken = () => mockGenerateFrontendToken();
  mocked.publicAuth.renewBackendAndFrontendTokens = (req, res) => {
    mockRenewBackendAndFrontendTokens(req, res);
  };

  return mocked;
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

const mockLogout = jest.fn();
const mockRequest = {
  logout: jest.fn(mockLogout),
  session: {
    destroy: jest.fn(),
  },
  user: {
    idToken: 'ey....',
    jwtFrontend: '567ghi',
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
      jest
        .spyOn(publicAuth, 'handleCallBackBusinessBceid')
        .mockResolvedValueOnce(LogoutReason.Login);

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
      jest
        .spyOn(publicAuth, 'handleCallBackBusinessBceid')
        .mockResolvedValueOnce(LogoutReason.ContactError);

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
    it("if user isn't initialized, fail with 401", () => {
      mockIsTokenExpired.mockReturnValue(false);
      mockIsRenewable.mockReturnValue(true);
      app.use((req: any, res, next) => {
        req.session = { ...mockRequest.session, companyDetails: { id: 1 } };
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        req.body = { refreshToken: mockRequest.user.jwtFrontend };
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
    it('should return unauthorized when jwt or refresh token is not found', () => {
      mockIsTokenExpired.mockReturnValue(false);
      mockIsRenewable.mockReturnValue(false);
      app.use((req: any, res, next) => {
        req.session = { ...mockRequest.session, companyDetails: { id: 1 } };
        req.user = mockRequest.user;
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app).post('/auth/refresh').expect(401);
    });
    it('should return 401 when the refreshToken body param contains a non-string', async () => {
      const mockCorrelationId = 12;
      mockIsTokenExpired.mockReturnValue(true);
      mockIsRenewable.mockReturnValue(true);

      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          companyDetails: { id: 1 },
          correlationID: mockCorrelationId,
        };
        req.user = { ...mockRequest.user, jwt: 'jwt', refreshToken: 'jwt' };
        req.logout = mockRequest.logout;
        req.body = { refreshToken: { $ne: '1' } };
        next();
      });
      app.use('/auth', router);
      await request(app).post('/auth/refresh').expect(401);
    });
    it('should renew the token if renewable', async () => {
      const mockCorrelationId = 12;
      const mockFrontendToken = 'jwt_value';
      mockIsTokenExpired.mockReturnValue(true);
      mockGenerateFrontendToken.mockReturnValue(mockFrontendToken);
      mockIsRenewable.mockReturnValue(true);
      mockRenewBackendAndFrontendTokens.mockImplementation((req, res) =>
        res.status(200).json({
          jwtFrontend: mockFrontendToken,
          correlationID: mockCorrelationId,
        }),
      );

      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          companyDetails: { id: 1 },
          correlationID: mockCorrelationId,
        };
        req.user = { ...mockRequest.user, jwt: 'jwt', refreshToken: 'jwt' };
        req.logout = mockRequest.logout;
        req.body = { refreshToken: mockRequest.user.jwtFrontend };
        next();
      });
      app.use('/auth', router);
      await request(app)
        .post('/auth/refresh')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            jwtFrontend: mockFrontendToken,
            correlationID: mockCorrelationId,
          });
        });
    });
    it('should return unauthorized when it fails to renew tokens', () => {
      const mockCorrelationId = 12;
      mockIsTokenExpired.mockReturnValue(true);
      mockGenerateFrontendToken.mockReturnValue('jwt_value');
      mockIsRenewable.mockReturnValue(true);
      mockRenew.mockResolvedValue({});
      mockRenewBackendAndFrontendTokens.mockImplementation((req, res) =>
        res.status(401).json({}),
      );

      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          companyDetails: { id: 1 },
          correlationID: mockCorrelationId,
        };
        req.user = { ...mockRequest.user, jwt: 'jwt', refreshToken: 'jwt' };
        req.logout = mockRequest.logout;
        next();
      });
      app.use('/auth', router);

      return request(app).post('/auth/refresh').expect(401);
    });
    it('should return unauthorized if token is not renewable', () => {
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
        req.body = { refreshToken: mockRequest.user.jwtFrontend };
        next();
      });
      app.use('/auth', router);

      return request(app).post('/auth/refresh').expect(401);
    });

    it('should return 200 with current user token', () => {
      mockIsTokenExpired.mockReturnValue(false);
      mockIsRenewable.mockReturnValue(false);
      app.use((req: any, res, next) => {
        req.session = {
          ...mockRequest.session,
          companyDetails: { id: 1 },
          correlationID: 12,
        };
        req.user = {
          ...mockRequest.user,
          jwt: 'jwt',
          refreshToken: 'jwt',
        };
        req.logout = mockRequest.logout;
        req.body = { refreshToken: mockRequest.user.jwtFrontend };
        next();
      });
      app.use('/auth', router);
      return request(app)
        .post('/auth/refresh')
        .set('Accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            jwtFrontend: mockRequest.user.jwtFrontend,
            correlationID: 12,
          });
        });
    });
  });
  describe('/token', () => {
    it('return 401 if token company details are missing', () => {
      mockRefreshJWT.mockImplementation((req, res, next) => next());
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
