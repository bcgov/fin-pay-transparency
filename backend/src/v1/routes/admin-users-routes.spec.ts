import express, { Application } from 'express';
import request from 'supertest';
import router from './admin-users-routes';
import bodyParser from 'body-parser';
import { faker } from '@faker-js/faker';

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

const mockAddNewUser = jest.fn();
jest.mock('../services/admin-users-services', () => ({
  AdminUserService: jest.fn().mockImplementation(() => ({
    addNewUser: () => mockAddNewUser(),
  })),
}));

const mockJWTDecode = jest.fn();
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  decode: () => {
    return mockJWTDecode();
  },
}));

let app: Application;
describe('admin-users-router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(bodyParser.json());
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
    });
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

      describe('/ [POST] - add user', () => {
        describe('validation fails', () => {
          it('400', () => {
            return request(app)
              .post('')
              .send({ firstName: '' })
              .expect(400)
              .expect(({ body }) => {
                expect(body.name).toBe('ZodError');
                expect(body.issues).toHaveLength(3);
              });
          });
        });
        describe('validation passes', () => {
          it('200 - success add user', async () => {
            mockJWTDecode.mockReturnValue({ idir_user_guid: '' });
            return request(app)
              .post('')
              .send({
                firstName: faker.person.firstName(),
                email: faker.internet.email(),
                role: 'PTRT-ADMIN',
              })
              .expect(200);
          });

          describe('when an error occurs', () => {
            it('400', () => {
              mockAddNewUser.mockRejectedValue(new Error('Error happened'));
              return request(app)
                .post('')
                .send({
                  firstName: faker.person.firstName(),
                  email: faker.internet.email(),
                  role: 'PTRT-ADMIN',
                })
                .expect(400);
            });
          });
        });
      });
    });
  });
});
