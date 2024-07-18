import { de } from '@faker-js/faker';
import bodyParser from 'body-parser';
import e, { Application } from 'express';
import request from 'supertest';

const mockGetAnnouncements = jest.fn().mockResolvedValue({
  items: [],
  total: 0,
  offset: 0,
  limit: 10,
  totalPages: 0,
});
jest.mock('../services/announcements-service', () => ({
  getAnnouncements: (...args) => {
    console.log('mockGetAnnouncements', args);
    return mockGetAnnouncements(...args);
  },
}));

describe('announcement-routes', () => {
  let app: Application;
  beforeEach(() => {
    jest.clearAllMocks();
    app = require('express')();
    app.use(bodyParser.json());
    app.use(require('./announcement-routes').default);
    app.use((error, req, res, next) => {
      res.status(400).json({ error: error.message });
    });
  });

  describe('GET /', () => {
    describe('when query is invalid', () => {
      it('should return 400', async () => {
        const response = await request(app)
          .get('/')
          .query({ filters: 'invalid' });
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

      describe('when search is provided', () => {
        it('should return announcements', async () => {
          const response = await request(app)
            .get('/')
            .query({ search: 'test' });
          expect(mockGetAnnouncements).toHaveBeenCalledWith(
            expect.objectContaining({ search: 'test' }),
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
      describe('when limit is provided', () => {
        it('should return announcements', async () => {
          const response = await request(app).get('/').query({ limit: 20 });
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
          const response = await request(app).get('/').query({ offset: 10 });
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
              .query({ sort: [{ field: 'status', order: 'asc' }] });
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
              .query({ sort: [{ field: 'invalid', order: 'asc' }] });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: expect.any(String) });
          });
        });
      });

      describe('when filters are provided', () => {
        describe('when filter is valid', () => {
          describe('status', () => {
            it('should return announcements', async () => {
              const response = await request(app)
                .get('/')
                .query({
                  filters: [
                    { key: 'status', operation: 'in', value: ['DRAFT'] },
                  ],
                });
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

            describe('when filter value is an array with multiple values', () => {
              it('should return announcements', async () => {
                const response = await request(app)
                  .get('/')
                  .query({
                    filters: [
                      {
                        key: 'status',
                        operation: 'in',
                        value: ['DRAFT', 'PUBLISHED'],
                      },
                    ],
                  });
                expect(mockGetAnnouncements).toHaveBeenCalledWith(
                  expect.objectContaining({
                    filters: [
                      {
                        key: 'status',
                        operation: 'in',
                        value: ['DRAFT', 'PUBLISHED'],
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

          describe('published_on', () => {
            it('should return announcements', async () => {
              const response = await request(app)
                .get('/')
                .query({
                  filters: [
                    {
                      key: 'published_on',
                      operation: 'between',
                      value: ['2022-01-01', '2022-12-31'],
                    },
                  ],
                });
              expect(mockGetAnnouncements).toHaveBeenCalledWith(
                expect.objectContaining({
                  filters: [
                    {
                      key: 'published_on',
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
                .query({
                  filters: [
                    {
                      key: 'expires_on',
                      operation: 'between',
                      value: ['2022-01-01', '2022-12-31'],
                    },
                  ],
                });
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
              .query({
                filters: [
                  { key: 'invalid', operation: 'in', value: ['DRAFT'] },
                ],
              });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: expect.any(String) });
          });
        });
      });
    });
  });
});
