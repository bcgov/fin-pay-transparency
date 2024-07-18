import { getAnnouncements } from './announcements-service';

const mockFindMany = jest.fn().mockResolvedValue([
  {
    id: 1,
    title: 'Announcement 1',
    description: 'Description 1',
    published_on: new Date(),
    expires_on: new Date(),
    status: 'active',
  },
  {
    id: 2,
    title: 'Announcement 2',
    description: 'Description 2',
    published_on: new Date(),
    expires_on: new Date(),
    status: 'active',
  },
]);

jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    announcement: {
      findMany: (...args) => mockFindMany(...args),
    },
  },
}));

describe('AnnouncementsService', () => {
  describe('getAnnouncements', () => {
    describe('when no query is provided', () => {
      it('should return announcements', async () => {
        const announcements = await getAnnouncements();
        expect(announcements).toHaveLength(2);
        expect(mockFindMany).toHaveBeenCalledTimes(1);
        expect(mockFindMany).toHaveBeenCalledWith({
          where: {},
          orderBy: [],
          take: 10,
          skip: 0,
        });
      });
    });

    describe('when query is provided', () => {
      describe('when search is provided', () => {
        it('should return announcements', async () => {
          await getAnnouncements({ search: 'Announcement 1' });
          expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                title: { contains: 'Announcement 1', mode: 'insensitive' },
              }),
            }),
          );
        });
      });

      describe('when filters are provided', () => {
        describe('when published_on filter is provided', () => {
          it('should return announcements', async () => {
            await getAnnouncements({
              filters: [
                {
                  key: 'published_on',
                  operation: 'between',
                  value: ['2022-01-01', '2022-12-31'],
                },
              ],
            });
            expect(mockFindMany).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  published_on: {
                    gte: '2022-01-01',
                    lt: '2022-12-31',
                  },
                }),
              }),
            );
          });
        });
        describe('when expires_on filter is provided', () => {
          it('should return announcements', async () => {
            await getAnnouncements({
              filters: [
                {
                  key: 'expires_on',
                  operation: 'between',
                  value: ['2022-01-01', '2022-12-31'],
                },
              ],
            });
            expect(mockFindMany).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  expires_on: {
                    gte: '2022-01-01',
                    lt: '2022-12-31',
                  },
                }),
              }),
            );
          });
        });

        describe('when status filter is provided', () => {
          describe('in operation', () => {
            it('should return announcements', async () => {
              await getAnnouncements({
                filters: [
                  {
                    key: 'status',
                    operation: 'in',
                    value: ['DRAFT'],
                  },
                ],
              });
              expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                  where: expect.objectContaining({
                    status: { in: ['DRAFT'] },
                  }),
                }),
              );
            });
          });

          describe('notin operation', () => {
            it('should return announcements', async () => {
              await getAnnouncements({
                filters: [
                  {
                    key: 'status',
                    operation: 'notin',
                    value: ['DRAFT'],
                  },
                ],
              });
              expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                  where: expect.objectContaining({
                    status: { not: { in: ['DRAFT'] } },
                  }),
                }),
              );
            });
          });
        });
      });

      describe('when sort is provided', () => {
        it('should return announcements', async () => {
          await getAnnouncements({
            sort: [{ field: 'title', order: 'asc' }],
          });
          expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
              orderBy: [{ title: 'asc' }],
            }),
          );
        });
      });

      describe('when limit is provided', () => {
        it('should return announcements', async () => {
          await getAnnouncements({ limit: 5 });
          expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
              take: 5,
            }),
          );
        });
      });

      describe('when offset is provided', () => {
        it('should return announcements', async () => {
          await getAnnouncements({ offset: 5 });
          expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
              skip: 5,
            }),
          );
        });
      });
    });
  });
});
