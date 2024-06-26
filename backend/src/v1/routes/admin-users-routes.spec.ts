import express, { Application } from 'express';
import request from 'supertest';
import router from './admin-users-routes';

const mockGetUsers = jest.fn();
const mockInitSSO = jest.fn();
jest.mock('../services/sso-service', () => ({
  SSO: {
    init: () => mockInitSSO(),
  },
}));

const mockGetSessionUser = jest.fn();
jest.mock('../services/utils-service', () => ({
  utils: {
    getSessionUser: () => mockGetSessionUser(),
  },
}));

let app: Application;
describe('admin-users-router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(router);
    app.use((err, req, res, next) => {
      res.status(400).send({ error: err.message });
    });
  });

  describe('when user is not admin', () => {
    it('401 - unauthorized', () => {
      mockGetSessionUser.mockReturnValue({
        _json: { client_roles: [] },
      });
      return request(app).get('').expect(401);
    });
  });

  describe('when user is admin', () => {
    beforeEach(() => {
      mockGetSessionUser.mockReturnValue({
        _json: { client_roles: ['PTRT-ADMIN'] },
      });
    })
    describe('css sso middleware init fails', () => {
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

    describe('css sso middleware passes', () => {
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
  });
});
