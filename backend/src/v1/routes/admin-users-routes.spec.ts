import express, { Application } from 'express';
import request from 'supertest';
import router from './admin-users-routes';

const mockGetUsers = jest.fn();
const mockInitSSO = jest.fn();
jest.mock('../services/admin-users-services', () => ({
  SSO: {
    init: () => mockInitSSO(),
  },
}));

let app: Application;
describe('admin-users-router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(router);
    app.use((err, req, res, next) => {
      console.log(err);
      res.status(400).send({ error: err.message });
    });
  });

  describe('css sso middleware', () => {
    it('should return 400 if sso init fails', () => {
      mockInitSSO.mockRejectedValue(new Error('Failed to initialize SSO'));
      return request(app)
        .get('')
        .expect(400)
        .expect(({ body }) => {
          expect(body.error).toBe('Failed to initialize SSO');
        });
    });
  });

  describe('/ [GET] - get users', () => {
    it('400 - if getUsers fails', () => {
      mockGetUsers.mockRejectedValue(new Error('Failed to get users'));
      mockInitSSO.mockReturnValue({
        getUsers: () => mockGetUsers(),
      });
      return request(app)
        .get('')
        .expect(400)
        .expect(({ body }) => {
          expect(body.error).toBe('Failed to get users');
        });
    });
    it('200 - return a list of users', () => {
      mockGetUsers.mockResolvedValue([]);
      mockInitSSO.mockReturnValue({
        getUsers: () => mockGetUsers(),
      });
      return request(app)
        .get('')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual([]);
        });
    });
  });
});
