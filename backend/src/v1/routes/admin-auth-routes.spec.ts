import request from 'supertest';
import express, { Application } from 'express';
import router from './admin-auth-routes';

const mockAuthenticate = jest.fn();
jest.mock('passport', () => ({
  authenticate: (...args) =>
    jest.fn((req, res, next) => mockAuthenticate(req, res, next)),
}));

const mockHandleCallBackAzureIdir = jest.fn();
jest.mock('../services/admin-auth-service', () => {
  const actualAdminAuth = jest.requireActual(
    '../services/admin-auth-service',
  ) as any;
  const mockedAdminAuth = jest.genMockFromModule(
    '../services/admin-auth-service',
  ) as any;

  const mocked = {
    ...mockedAdminAuth,
    adminAuth: { ...actualAdminAuth.adminAuth },
  };

  mocked.adminAuth.handleCallBackAzureIdir = () => mockHandleCallBackAzureIdir()

  return mocked;
});

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
});
