import express, { Application } from 'express';
import router from './auth-routes';
import request from 'supertest';
let app: Application;

const mockHandleCallbackBusinessBceid = jest.fn();
jest.mock('../services/auth-service', () => ({
  auth: {
    handleCallBackBusinessBceid: (...args) =>
      mockHandleCallbackBusinessBceid(...args),
    refreshJWT: () => jest.fn(() => mockRefreshJWT()),
  },
}));
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
  },
};

describe('auth-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use('', router);
  });

  describe('/callback_business_bceid [GET]', () => {
    it('should execute handleCallBackBusinessBceid', () => {
      mockAuthenticate.mockImplementation((_, __, next) => {
        next();
      });

      mockHandleCallbackBusinessBceid.mockImplementation((req, res) => {
        return res.status(200).send({ success: true });
      });

      return request(app).get('/callback_business_bceid').expect(200);
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
});
