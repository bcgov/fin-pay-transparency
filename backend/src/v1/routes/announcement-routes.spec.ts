import { vi, describe, it, expect, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import bodyParser from 'body-parser';
import express, { Application } from 'express';
import qs from 'qs';
import request from 'supertest';
import router from './announcement-routes.js';
import { setAdminAuthState } from '../middlewares/authorization/__mocks__/authenticate-admin.js';

const mockGetAnnouncements = vi.fn((...args) => ({
  items: [],
  total: 0,
  offset: 0,
  limit: 10,
  totalPages: 0,
}));

const mockPatchAnnouncements = vi.fn();
const mockCreateAnnouncement = vi.fn();
const mockUpdateAnnouncement = vi.fn();
const mockGetAnnouncementById = vi.fn();
vi.mock('../services/announcements-service', () => ({
  announcementService: {
    getAnnouncements: (...args) => mockGetAnnouncements(...args),
    patchAnnouncements: (...args) => mockPatchAnnouncements(...args),
    createAnnouncement: (...args) => mockCreateAnnouncement(...args),
    updateAnnouncement: (...args) => mockUpdateAnnouncement(...args),
    getAnnouncementById: (...args) => mockGetAnnouncementById(...args),
  },
}));

vi.mock('../middlewares/authorization/authenticate-admin');
vi.mock('../middlewares/authorization/authorize', () => ({
  authorize:
    (...args) =>
    (req, res, next) => {
      next();
    },
}));

describe('announcement-routes', () => {
  let app: Application;
  beforeEach(() => {
    setAdminAuthState('admin');
    app = express();
    app.set('query parser', 'extended');
    app.use(bodyParser.json());
    app.use(router);
    app.use((error, req, res, next) => {
      res.status(400).json({ error: error.message });
    });
  });

  describe('GET /', () => {
    describe('when query is invalid', () => {
      it('should return 400', async () => {
        const response = await request(app)
          .get('/')
          .query(qs.stringify({ filters: 'invalid' }));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: expect.any(String) });
      });
    });

    describe('when query is valid', () => {
      describe('when no query is provided', () => {
        it('should return announcements', async () => {
          const response = await request(app).get('/');
          expect(mockGetAnnouncements).toHaveBeenCalledWith({});
          expect(response.status).toBe(200);
          expect(response.body).toEqual({
            items: [],
            total: 0,
            offset: 0,
            limit: 10,
            totalPages: 0,
          });
        });
      });

      describe('when limit is provided', () => {
        it('should return announcements', async () => {
          const response = await request(app)
            .get('/')
            .query(qs.stringify({ limit: 20 }));
          expect(mockGetAnnouncements).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 20 }),
          );
          expect(response.status).toBe(200);
          expect(response.body).toEqual({
            items: [],
            total: 0,
            offset: 0,
            limit: 10,
            totalPages: 0,
          });
        });
      });

      describe('when offset is provided', () => {
        it('should return announcements', async () => {
          const response = await request(app)
            .get('/')
            .query(qs.stringify({ offset: 10 }));
          expect(mockGetAnnouncements).toHaveBeenCalledWith(
            expect.objectContaining({ offset: 10 }),
          );
          expect(response.status).toBe(200);
          expect(response.body).toEqual({
            items: [],
            total: 0,
            offset: 0,
            limit: 10,
            totalPages: 0,
          });
        });
      });

      describe('when sort is provided', () => {
        describe('when sort is valid', () => {
          it('should return announcements', async () => {
            const response = await request(app)
              .get('/')
              .query(
                qs.stringify({ sort: [{ field: 'status', order: 'asc' }] }),
              );
            expect(mockGetAnnouncements).toHaveBeenCalledWith(
              expect.objectContaining({
                sort: [{ field: 'status', order: 'asc' }],
              }),
            );
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
              items: [],
              total: 0,
              offset: 0,
              limit: 10,
              totalPages: 0,
            });
          });
        });

        describe('when sort is invalid', () => {
          it('should return 400', async () => {
            const response = await request(app)
              .get('/')
              .query(
                qs.stringify({ sort: [{ field: 'invalid', order: 'asc' }] }),
              );
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: expect.any(String) });
          });
        });

        describe('when sort is provided in public frontend', () => {
          it('should be ignored and set to the default', async () => {
            setAdminAuthState('non-admin');
            const response = await request(app)
              .get('/')
              .query(
                qs.stringify({ sort: [{ field: 'status', order: 'asc' }] }),
              );
            expect(mockGetAnnouncements).toHaveBeenCalledWith(
              expect.objectContaining({
                sort: [{ field: 'updated_date', order: 'desc' }],
              }),
            );
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
              items: [],
              total: 0,
              offset: 0,
              limit: 10,
              totalPages: 0,
            });
          });
        });
      });

      describe('when filters are provided', () => {
        describe('when filter is valid', () => {
          describe('title', () => {
            it('should return announcements', async () => {
              const response = await request(app)
                .get('/')
                .query(
                  qs.stringify({
                    filters: [
                      { key: 'title', operation: 'like', value: 'test' },
                    ],
                  }),
                );
              expect(mockGetAnnouncements).toHaveBeenCalledWith(
                expect.objectContaining({
                  filters: [{ key: 'title', operation: 'like', value: 'test' }],
                }),
              );
              expect(response.status).toBe(200);
              expect(response.body).toEqual({
                items: [],
                total: 0,
                offset: 0,
                limit: 10,
                totalPages: 0,
              });
            });
          });
          describe('status', () => {
            it('should return announcements', async () => {
              const response = await request(app)
                .get('/')
                .query(
                  qs.stringify({
                    filters: [
                      { key: 'status', operation: 'in', value: ['DRAFT'] },
                    ],
                  }),
                );
              expect(mockGetAnnouncements).toHaveBeenCalledWith(
                expect.objectContaining({
                  filters: [
                    { key: 'status', operation: 'in', value: ['DRAFT'] },
                  ],
                }),
              );
              expect(response.status).toBe(200);
              expect(response.body).toEqual({
                items: [],
                total: 0,
                offset: 0,
                limit: 10,
                totalPages: 0,
              });
            });
          });

          describe('active_on', () => {
            it('should return announcements', async () => {
              const response = await request(app)
                .get('/')
                .query(
                  qs.stringify({
                    filters: [
                      {
                        key: 'active_on',
                        operation: 'between',
                        value: ['2022-01-01', '2022-12-31'],
                      },
                    ],
                  }),
                );
              expect(mockGetAnnouncements).toHaveBeenCalledWith(
                expect.objectContaining({
                  filters: [
                    {
                      key: 'active_on',
                      operation: 'between',
                      value: ['2022-01-01', '2022-12-31'],
                    },
                  ],
                }),
              );
              expect(response.status).toBe(200);
              expect(response.body).toEqual({
                items: [],
                total: 0,
                offset: 0,
                limit: 10,
                totalPages: 0,
              });
            });
          });

          describe('expires_on', () => {
            it('should return announcements', async () => {
              const response = await request(app)
                .get('/')
                .query(
                  qs.stringify({
                    filters: [
                      {
                        key: 'expires_on',
                        operation: 'between',
                        value: ['2022-01-01', '2022-12-31'],
                      },
                    ],
                  }),
                );
              expect(mockGetAnnouncements).toHaveBeenCalledWith(
                expect.objectContaining({
                  filters: [
                    {
                      key: 'expires_on',
                      operation: 'between',
                      value: ['2022-01-01', '2022-12-31'],
                    },
                  ],
                }),
              );
              expect(response.status).toBe(200);
              expect(response.body).toEqual({
                items: [],
                total: 0,
                offset: 0,
                limit: 10,
                totalPages: 0,
              });
            });
          });
        });

        describe('when filter is invalid', () => {
          it('should return 400', async () => {
            const response = await request(app)
              .get('/')
              .query(
                qs.stringify({
                  filters: [
                    { key: 'invalid', operation: 'in', value: ['DRAFT'] },
                  ],
                }),
              );
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: expect.any(String) });
          });
        });

        describe('when filters are provided in public frontend', () => {
          it('should be ignored and set to the default', async () => {
            setAdminAuthState('non-admin');
            const response = await request(app)
              .get('/')
              .query(
                qs.stringify({
                  filters: [
                    { key: 'status', operation: 'in', value: ['DRAFT'] },
                  ],
                }),
              );
            expect(mockGetAnnouncements).toHaveBeenCalledWith(
              expect.objectContaining({
                filters: expect.arrayContaining([
                  { key: 'status', operation: 'in', value: ['PUBLISHED'] },
                ]),
              }),
            );
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
              items: [],
              total: 0,
              offset: 0,
              limit: 10,
              totalPages: 0,
            });
          });
        });
      });
    });

    describe('when service throws error', () => {
      it('should return 400', async () => {
        mockGetAnnouncements.mockRejectedValue(new Error('Invalid request'));
        const response = await request(app).get('/');
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid request');
      });
    });
  });

  describe('PATCH / - archive announcements', () => {
    describe('when body is invalid', () => {
      it('should return 400', async () => {
        const response = await request(app).patch('/');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: expect.any(String) });
      });
    });

    describe('when body is valid', () => {
      it('should return 201', async () => {
        const data = [{ id: faker.string.uuid(), status: 'ARCHIVED' }];
        const response = await request(app).patch('/').send(data);
        expect(mockPatchAnnouncements).toHaveBeenCalled();
        expect(response.status).toBe(201);
        expect(response.body).toEqual({
          message: `Updated the status of the announcement(s)`,
        });
      });
    });

    describe('when service throws error', () => {
      it('should return 400', async () => {
        mockPatchAnnouncements.mockRejectedValue(new Error('Invalid request'));
        const response = await request(app)
          .patch('/')
          .send([{ id: faker.string.uuid(), status: 'DELETED' }]);

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('POST /', () => {
    describe('when body is invalid', () => {
      it('should return 400', async () => {
        const response = await request(app).post('/');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: expect.any(String) });
      });
    });

    describe('when body is valid', () => {
      it('should return 201', async () => {
        mockCreateAnnouncement.mockResolvedValue({
          message: 'Announcement created',
        });
        const response = await request(app)
          .post('/')
          .send({
            title: 'Test',
            //long description.  this would be rejected by the frontend,
            //but should be allowed by the backend (because the backend expects
            //some of the characters may be rich text markup, which the system doesn't
            //put a limit on
            description: '0'.repeat(2001),
            expires_on: faker.date.recent(),
            active_on: faker.date.future(),
            status: 'DRAFT',
          });
        expect(response.status).toBe(201);
        expect(response.body).toEqual({ message: 'Announcement created' });
      });

      describe('when service throws error', () => {
        it('should return 400', async () => {
          mockCreateAnnouncement.mockRejectedValue(
            new Error('Invalid request'),
          );
          const response = await request(app).post('/').send({
            title: 'Test',
            description: 'Test',
            expires_on: faker.date.recent(),
            active_on: faker.date.future(),
            status: 'DRAFT',
          });

          expect(response.status).toBe(400);
          expect(response.body.error).toBeDefined();
        });
      });
    });
  });

  describe('PUT /:id', () => {
    describe('when body is invalid', () => {
      it('should return 400', async () => {
        const response = await request(app).put('/123');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: expect.any(String) });
      });
    });

    describe('when body is valid', () => {
      it('should return 200', async () => {
        const response = await request(app).put('/123').send({
          title: 'Test',
          description: 'Test',
          expires_on: faker.date.recent(),
          active_on: faker.date.future(),
          status: 'DRAFT',
        });
        expect(response.status).toBe(200);
      });
    });

    describe('when service throws error', () => {
      it('should return 400', async () => {
        mockUpdateAnnouncement.mockRejectedValue(new Error('Invalid request'));
        const response = await request(app).put('/123').send({
          title: 'Test',
          description: 'Test',
          expires_on: faker.date.recent(),
          active_on: faker.date.future(),
          status: 'DRAFT',
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('GET /:id - get announcement by id', () => {
    it('should return 200', async () => {
      const response = await request(app).get('/123');
      expect(response.status).toBe(200);
      expect(mockGetAnnouncementById).toHaveBeenCalledWith('123');
    });

    describe('when service throws error', () => {
      it('should return 400', async () => {
        mockGetAnnouncementById.mockRejectedValue(new Error('Invalid request'));
        const response = await request(app).get('/123');

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });
  });
});
