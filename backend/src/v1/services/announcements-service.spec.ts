import { getAnnouncements, patchAnnouncements } from './announcements-service';

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

const mockUpdateMany = jest.fn();
const mockHistoryCreate = jest.fn();
jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    announcement: {
      findMany: (...args) => mockFindMany(...args),
      count: jest.fn().mockResolvedValue(2),
      updateMany: (...args) => mockUpdateMany(...args),
    },
    announcement_history: {
      create: (...args) => mockHistoryCreate(...args),
    },
    $transaction: jest.fn().mockImplementation((cb) =>
      cb({
        announcement: {
          findMany: (...args) => mockFindMany(...args),
          updateMany: (...args) => mockUpdateMany(...args),
        },
        announcement_history: {
          create: (...args) => mockHistoryCreate(...args),
        },
      }),
    ),
  },
}));

describe('AnnouncementsService', () => {
  describe('getAnnouncements', () => {
    describe('when no query is provided', () => {
      it('should return announcements', async () => {
        const announcements = await getAnnouncements();
        expect(announcements.items).toHaveLength(2);
        expect(announcements.total).toBe(2);
        expect(announcements.offset).toBe(0);
        expect(announcements.limit).toBe(10);
        expect(announcements.totalPages).toBe(1);
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
      

      describe('when filters are provided', () => {

        describe('when title is provided', () => {
          it('should return announcements', async () => {
            await getAnnouncements({ filters: [{key: 'title', operation: 'like', value: 'Announcement 1'}] });
            expect(mockFindMany).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  title: { contains: 'Announcement 1', mode: 'insensitive' },
                }),
              }),
            );
          });
        });
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

  describe('patchAnnouncements', () => {
    it('should delete announcements', async () => {
      mockFindMany.mockResolvedValue([
        {
          announcement_id: 4,
          title: 'Announcement 4',
          announcement_resource: [],
        },
        {
          announcement_id: 5,
          title: 'Announcement 5',
          announcement_resource: [],
        },
      ]);
      await patchAnnouncements(
        [
          { id: '1', status: 'DELETED' },
          { id: '2', status: 'DELETED' },
        ],
        'user-id',
      );
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            announcement_id: {
              in: ['1', '2'],
            },
          },
        }),
      );
      expect(mockHistoryCreate).toHaveBeenCalledTimes(2);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { announcement_id: { in: ['1', '2'] } },
        data: {
          status: 'DELETED',
          updated_by: 'user-id',
          updated_date: expect.any(Date),
        },
      });
    });
  });
});
