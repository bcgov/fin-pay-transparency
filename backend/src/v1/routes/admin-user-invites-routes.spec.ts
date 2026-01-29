import { faker } from '@faker-js/faker';
import express, { Application } from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import { UserInputError } from '../types/errors.js';
import routes from '../routes/admin-user-invites-routes.js';

const mockDeleteInvite = jest.fn();
const mockGetPendingInvites = jest.fn();
const mockCreateInvite = jest.fn();
const mockResendInvite = jest.fn();
jest.mock('../services/admin-user-invites-service', () => ({
  adminUserInvitesService: {
    deleteInvite: (...args) => mockDeleteInvite(...args),
    getPendingInvites: (...args) => mockGetPendingInvites(...args),
    createInvite: (...args) => mockCreateInvite(...args),
    resendInvite: (...args) => mockResendInvite(...args),
  },
}));

jest.mock('../middlewares/authorization/authorize', () => ({
  authorize: () => (req, res, next) => next(),
}));

const mockJWTDecode = jest.fn();
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  decode: () => {
    return mockJWTDecode();
  },
}));

const mockGetSessionUser = jest.fn();
jest.mock('../services/utils-service', () => ({
  utils: {
    getSessionUser: () => mockGetSessionUser(),
  },
}));

describe('admin-user-invites-routes', () => {
  let app: Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.set('query parser', 'extended');
    app.use(bodyParser.json());
    app.use(routes);
    app.use((err, req, res, _) => {
      res.status(400).send({ error: err.message });
    });
  });

  describe('/ [GET] - get pending invites', () => {
    it('should return all pending invites', async () => {
      mockGetPendingInvites.mockResolvedValue([]);
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 400 when failed to get invites', async () => {
      mockGetPendingInvites.mockRejectedValue(
        new Error('Failed to get invites'),
      );
      const response = await request(app).get('/');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Failed to get invites' });
    });
  });

  describe('/ [POST] - add user', () => {
    beforeEach(() => {
      mockGetSessionUser.mockReturnValue({
        _json: { client_roles: ['PTRT-ADMIN'] },
      });
    });
    describe('validation fails', () => {
      it('400 - failed fields validation', () => {
        return request(app)
          .post('')
          .send({ firstName: '' })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBeDefined();
            const errors = JSON.parse(body.error);
            expect(errors).toHaveLength(3);
          });
      });

      it('400 - failed email validation', () => {
        return request(app)
          .post('')
          .send({
            role: 'PTRT-ADMIN',
            firstName: faker.person.firstName(),
            email: faker.internet.email({ provider: 'gov1.bc.ca' }),
          })
          .expect(400)
          .expect(({ body }) => {
            expect(body.error).toBeDefined();
            const errors = JSON.parse(body.error);
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toBe(
              'Email address must be a government email address',
            );
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
            email: faker.internet.email({ provider: 'gov.bc.ca' }),
            role: 'PTRT-ADMIN',
          })
          .expect(200);
      });

      describe('when an internal error occurs (not related to user input)', () => {
        it('500', () => {
          mockCreateInvite.mockRejectedValue(new Error('Error happened'));
          return request(app)
            .post('')
            .send({
              firstName: faker.person.firstName(),
              email: faker.internet.email({ provider: 'gov.bc.ca' }),
              role: 'PTRT-ADMIN',
            })
            .expect(500);
        });
      });

      describe('when a UserInputError occurs', () => {
        it('400', () => {
          mockCreateInvite.mockRejectedValue(
            new UserInputError('Error happened'),
          );
          return request(app)
            .post('')
            .send({
              firstName: faker.person.firstName(),
              email: faker.internet.email({ provider: 'gov.bc.ca' }),
              role: 'PTRT-ADMIN',
            })
            .expect(400);
        });
      });
    });
  });

  describe('/:id [PATCH] - resend invite', () => {
    it('200 - success resend invite', async () => {
      mockResendInvite.mockResolvedValue({});
      const response = await request(app).patch('/1');
      expect(mockResendInvite).toHaveBeenCalledWith('1');
      expect(response.status).toBe(200);
    });

    it('400 - when failed to resend invite', async () => {
      mockResendInvite.mockRejectedValue(new Error('Failed to resend invite'));
      const response = await request(app).patch('/1');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Failed to resend invite' });
    });
  });

  describe('/:id [DELETE] - delete invite', () => {
    it('200 - success delete invite', async () => {
      mockDeleteInvite.mockResolvedValue({});
      const response = await request(app).delete('/1');
      expect(mockDeleteInvite).toHaveBeenCalledWith('1');
      expect(response.status).toBe(200);
    });

    it('400 - when failed to delete invite', async () => {
      mockDeleteInvite.mockRejectedValue(new Error('Failed to delete invite'));
      const response = await request(app).delete('/1');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Failed to delete invite' });
    });
  });
});
