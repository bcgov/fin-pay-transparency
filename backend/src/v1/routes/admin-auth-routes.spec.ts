import express, { Application } from 'express';
import request from 'supertest';
import router from './admin-auth-routes.js';

const mockAuthenticate = jest.fn();
jest.mock('passport', () => ({
  authenticate: (...args) =>
    jest.fn((req, res, next) => mockAuthenticate(req, res, next)),
}));

const mockIsTokenExpired = jest.fn();
const mockIsRenewable = jest.fn();
const mockRenew = jest.fn();
const mockGenerateFrontendToken = jest.fn();
const mockRenewBackendAndFrontendTokens = jest.fn((req, res) => {
  res.status(200).json({});
});
const mockHandleCallBackAzureIdir = jest.fn();
jest.mock('../services/admin-auth-service', () => {
  const actualAdminAuth = jest.requireActual(
    '../services/admin-auth-service',
  ) as any;
  const mockedAdminAuth = jest.createMockFromModule(
    '../services/admin-auth-service',
  ) as any;

  const mocked = {
    ...mockedAdminAuth,
    adminAuth: { ...actualAdminAuth.adminAuth },
  };

  mocked.adminAuth.handleCallBackAzureIdir = () =>
    mockHandleCallBackAzureIdir();
  mocked.adminAuth.isTokenExpired = () => mockIsTokenExpired();
  mocked.adminAuth.isRenewable = () => mockIsRenewable();
  mocked.adminAuth.renew = () => mockRenew();
  mocked.adminAuth.generateFrontendToken = () => mockGenerateFrontendToken();
  mocked.adminAuth.renewBackendAndFrontendTokens = (req, res) => {
    mockRenewBackendAndFrontendTokens(req, res);
  };
  return mocked;
});

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

let app: Application;
describe('admin-auth-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('', router);
    app.use((err, req, res, next) => {
      res.status(400).send({ error: err.message });
    });
  });

  describe('/callback_azureidir', () => {
    describe('401 - unauthorized', () => {
      it('should return unauthorized', () => {
        mockAuthenticate.mockImplementation((req, res) => {
          return res.status(401).json({ message: 'Unauthorized' });
        });

        return request(app).get('/callback_azureidir').expect(401);
      });
    });

    describe('handle login callback', () => {
      describe('when login is successful', () => {
        it('should redirect', () => {
          mockAuthenticate.mockImplementation((req, res, next) => {
            next();
          });
          mockHandleCallBackAzureIdir.mockResolvedValue('login');
          return request(app).get('/callback_azureidir').expect(302);
        });
      });
    });
  });

  describe('/refresh', () => {
    describe('if the given token (in the request body) is expired and is renewable', () => {
      it('should return 200 with current user token', () => {
        mockIsTokenExpired.mockReturnValue(false);
        mockIsRenewable.mockReturnValue(false);
        const mockCorrelationId = 12;
        app.use((req: any, res, next) => {
          req.session = {
            ...mockRequest.session,
            companyDetails: { id: 1 },
            correlationID: mockCorrelationId,
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
              correlationID: mockCorrelationId,
            });
          });
      });
    });
  });
});
