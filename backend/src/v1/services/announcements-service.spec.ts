import { faker } from '@faker-js/faker';
import omit from 'lodash/omit';
import {
  AnnouncementDataType,
  AnnouncementStatus,
} from '../types/announcements';
import { UserInputError } from '../types/errors';
import * as AnnouncementService from './announcements-service';
import { utils } from './utils-service';
import { LocalDateTime, ZonedDateTime, ZoneId } from '@js-joda/core';
import { updateAnnouncement } from './announcements-service';

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

const mockFindUniqueOrThrow = jest.fn();
const mockUpdateMany = jest.fn();
const mockUpdate = jest.fn();
const mockCreateResource = jest.fn();
const mockDeleteResource = jest.fn();
const mockUpdateResource = jest.fn();
const mockHistoryCreate = jest.fn();
const mockCreateAnnouncement = jest.fn();
jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    announcement: {
      findMany: (...args) => mockFindMany(...args),
      count: jest.fn().mockResolvedValue(2),
      updateMany: (...args) => mockUpdateMany(...args),
      create: (...args) => mockCreateAnnouncement(...args),
      findUniqueOrThrow: (...args) => mockFindUniqueOrThrow(...args),
    },
    announcement_history: {
      create: (...args) => mockHistoryCreate(...args),
    },
    $transaction: jest.fn().mockImplementation((cb) =>
      cb({
        announcement: {
          findMany: (...args) => mockFindMany(...args),
          updateMany: (...args) => mockUpdateMany(...args),
          findUniqueOrThrow: (...args) => mockFindUniqueOrThrow(...args),
          update: (...args) => mockUpdate(...args),
        },
        announcement_resource: {
          create: (...args) => mockCreateResource(...args),
          update: (...args) => mockUpdateResource(...args),
          delete: (...args) => mockDeleteResource(...args),
        },
        announcement_history: {
          create: (...args) => mockHistoryCreate(...args),
          update: (...args) => mockUpdateResource(...args),
        },
        $executeRawUnsafe: jest.fn(),
      }),
    ),
  },
}));

jest.mock('../../config', () => ({
  config: {
    get: (key: string) => {
      const settings = {
        'server:schedulerTimeZone': 'America/Vancouver',
      };
      return settings[key];
    },
  },
}));

describe('AnnouncementsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnnouncements', () => {
    describe('when no query is provided', () => {
      it('should return announcements', async () => {
        const announcements = await AnnouncementService.getAnnouncements();
        expect(announcements.items).toHaveLength(2);
        expect(announcements.total).toBe(2);
        expect(announcements.offset).toBe(0);
        expect(announcements.limit).toBe(10);
        expect(announcements.totalPages).toBe(1);
        expect(mockFindMany).toHaveBeenCalledTimes(1);
        expect(mockFindMany).toHaveBeenCalledWith({
          where: {
            AND: [],
          },
          orderBy: [],
          include: { announcement_resource: true },
          take: 10,
          skip: 0,
        });
      });
    });

    describe('when query is provided', () => {
      describe('when filters are provided', () => {
        describe('when title is provided', () => {
          it('should return announcements', async () => {
            await AnnouncementService.getAnnouncements({
              filters: [
                { key: 'title', operation: 'like', value: 'Announcement 1' },
              ],
            });
            expect(mockFindMany).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  AND: [
                    {
                      title: {
                        contains: 'Announcement 1',
                        mode: 'insensitive',
                      },
                    },
                  ],
                }),
              }),
            );
          });
        });
        describe('when published_on filter is provided', () => {
          describe('when operation is "between"', () => {
            it('should return announcements', async () => {
              await AnnouncementService.getAnnouncements({
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
                    AND: [
                      { published_on: { gte: '2022-01-01', lt: '2022-12-31' } },
                    ],
                  }),
                }),
              );
            });
          });
          describe('when operation is "lte"', () => {
            it('should return announcements', async () => {
              await AnnouncementService.getAnnouncements({
                filters: [
                  {
                    key: 'published_on',
                    operation: 'lte',
                    value: ['2022-01-01'],
                  },
                ],
              });
              expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                  where: expect.objectContaining({
                    AND: [{ published_on: { lte: ['2022-01-01'] } }],
                  }),
                }),
              );
            });
          });
          describe('when operation is "gt"', () => {
            it('should return announcements', async () => {
              await AnnouncementService.getAnnouncements({
                filters: [
                  {
                    key: 'published_on',
                    operation: 'gt',
                    value: ['2022-01-01'],
                  },
                ],
              });
              expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                  where: expect.objectContaining({
                    AND: [{ published_on: { gt: ['2022-01-01'] } }],
                  }),
                }),
              );
            });
          });
        });
        describe('when expires_on filter is provided', () => {
          describe('when operation is "between"', () => {
            it('should return announcements', async () => {
              await AnnouncementService.getAnnouncements({
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
                    AND: [
                      { expires_on: { gte: '2022-01-01', lt: '2022-12-31' } },
                    ],
                  }),
                }),
              );
            });
          });
          describe('when operation is "lte"', () => {
            it('should return announcements', async () => {
              await AnnouncementService.getAnnouncements({
                filters: [
                  {
                    key: 'expires_on',
                    operation: 'lte',
                    value: ['2022-01-01'],
                  },
                ],
              });
              expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                  where: expect.objectContaining({
                    AND: [{ expires_on: { lte: ['2022-01-01'] } }],
                  }),
                }),
              );
            });
          });
          describe('when operation is "gt"', () => {
            it('should return announcements', async () => {
              await AnnouncementService.getAnnouncements({
                filters: [
                  {
                    key: 'expires_on',
                    operation: 'gt',
                    value: ['2022-01-01'],
                  },
                ],
              });
              expect(mockFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                  where: expect.objectContaining({
                    AND: [
                      {
                        OR: [
                          { expires_on: { gt: ['2022-01-01'] } },
                          { expires_on: null },
                        ],
                      },
                    ],
                  }),
                }),
              );
            });
          });
        });

        describe('when status filter is provided', () => {
          describe('in operation', () => {
            it('should return announcements', async () => {
              await AnnouncementService.getAnnouncements({
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
                    AND: [{ status: { in: ['DRAFT'] } }],
                  }),
                }),
              );
            });
          });

          describe('notin operation', () => {
            it('should return announcements', async () => {
              await AnnouncementService.getAnnouncements({
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
                    AND: [{ status: { not: { in: ['DRAFT'] } } }],
                  }),
                }),
              );
            });
          });
        });
      });

      describe('when sort is provided', () => {
        it('should return announcements', async () => {
          await AnnouncementService.getAnnouncements({
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
          await AnnouncementService.getAnnouncements({ limit: 5 });
          expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({
              take: 5,
            }),
          );
        });
      });

      describe('when offset is provided', () => {
        it('should return announcements', async () => {
          await AnnouncementService.getAnnouncements({ offset: 5 });
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
    describe('when provided a list of objects and at least one requests an invalid status change', () => {
      it('throws a UserInputError', async () => {
        const data: any = [
          { id: '1', status: AnnouncementStatus.Deleted }, //is supported
          { id: '2', status: AnnouncementStatus.Published }, //isn't supported
        ];
        const mockUserId = 'user-id';
        await expect(
          AnnouncementService.patchAnnouncements(data, mockUserId),
        ).rejects.toThrow(UserInputError);
      });
    });
    describe('when provided a list of objects with valid status changes', () => {
      it("should change status and update the 'updated_by' and 'updated_date' cols", async () => {
        const mockUserId = 'user-id';
        const mockUpdateManyUnsafe = jest
          .spyOn(utils, 'updateManyUnsafe')
          .mockResolvedValue(null);
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
        await AnnouncementService.patchAnnouncements(
          [
            { id: '1', status: AnnouncementStatus.Deleted },
            { id: '2', status: AnnouncementStatus.Draft },
            { id: '3', status: AnnouncementStatus.Expired },
          ],
          mockUserId,
        );
        expect(mockFindMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              announcement_id: {
                in: ['1', '2', '3'],
              },
            },
          }),
        );
        expect(mockHistoryCreate).toHaveBeenCalledTimes(2);
        const updates = mockUpdateManyUnsafe.mock.calls[0][1];
        expect(updates).toStrictEqual([
          {
            announcement_id: '1',
            status: AnnouncementStatus.Deleted,
            updated_by: mockUserId,
            updated_date: expect.any(Date),
          },
          {
            announcement_id: '2',
            status: AnnouncementStatus.Draft,
            updated_by: mockUserId,
            updated_date: expect.any(Date),
          },
          {
            announcement_id: '3',
            status: AnnouncementStatus.Expired,
            updated_by: mockUserId,
            updated_date: expect.any(Date),
          },
        ]);
      });
    });
  });

  describe('createAnnouncement', () => {
    it('should create announcement', async () => {
      const announcementInput: AnnouncementDataType = {
        title: faker.lorem.words(3),
        description: faker.lorem.words(10),
        expires_on: faker.date.recent().toISOString(),
        published_on: faker.date.future().toISOString(),
        status: AnnouncementStatus.Published,
        linkDisplayName: faker.lorem.words(3),
        linkUrl: faker.internet.url(),
        attachmentId: 'attachment-id',
        fileDisplayName: faker.lorem.words(3),
      };
      await AnnouncementService.createAnnouncement(
        announcementInput,
        'user-id',
      );
      expect(mockCreateAnnouncement).toHaveBeenCalledWith({
        data: {
          ...omit(
            announcementInput,
            'status',
            'linkDisplayName',
            'linkUrl',
            'attachmentId',
            'fileDisplayName',
          ),
          announcement_status: {
            connect: { code: AnnouncementStatus.Published },
          },
          announcement_resource: {
            createMany: {
              data: [
                {
                  display_name: announcementInput.fileDisplayName,
                  attachment_file_id: 'attachment-id',
                  resource_type: 'ATTACHMENT',
                  created_by: 'user-id',
                  updated_by: 'user-id',
                },
                {
                  display_name: announcementInput.linkDisplayName,
                  resource_url: announcementInput.linkUrl,
                  resource_type: 'LINK',
                  created_by: 'user-id',
                  updated_by: 'user-id',
                },
              ],
            },
          },
          admin_user_announcement_created_byToadmin_user: {
            connect: { admin_user_id: 'user-id' },
          },
          admin_user_announcement_updated_byToadmin_user: {
            connect: { admin_user_id: 'user-id' },
          },
        },
      });
    });
    it('should default to undefined dates', async () => {
      const announcementInput: AnnouncementDataType = {
        title: faker.lorem.words(3),
        description: faker.lorem.words(10),
        expires_on: '',
        published_on: '',
        status: 'DRAFT',
        linkDisplayName: '',
        linkUrl: '',
      };
      await AnnouncementService.createAnnouncement(
        announcementInput,
        'user-id',
      );
      expect(mockCreateAnnouncement).toHaveBeenCalledWith({
        data: {
          ...omit(announcementInput, 'status', 'linkDisplayName', 'linkUrl'),
          expires_on: undefined,
          published_on: undefined,
          announcement_status: {
            connect: { code: 'DRAFT' },
          },
          admin_user_announcement_created_byToadmin_user: {
            connect: { admin_user_id: 'user-id' },
          },
          admin_user_announcement_updated_byToadmin_user: {
            connect: { admin_user_id: 'user-id' },
          },
        },
      });
    });
  });

  describe('updateAnnouncement', () => {
    describe('with existing link resource', () => {
      it('should update announcement and resource', async () => {
        mockFindUniqueOrThrow.mockResolvedValue({
          id: 'announcement-id',
          announcement_resource: [
            { announcement_resource_id: 1, resource_type: 'LINK' },
          ],
        });
        const announcementInput: AnnouncementDataType = {
          title: faker.lorem.words(3),
          description: faker.lorem.words(10),
          expires_on: faker.date.recent().toISOString(),
          published_on: faker.date.future().toISOString(),
          status: AnnouncementStatus.Published,
          linkDisplayName: faker.lorem.words(3),
          linkUrl: faker.internet.url(),
        };
        await AnnouncementService.updateAnnouncement(
          'announcement-id',
          announcementInput,
          'user-id',
        );
        expect(mockHistoryCreate).toHaveBeenCalled();
        expect(mockUpdateResource).toHaveBeenCalledWith({
          where: { announcement_resource_id: 1 },
          data: {
            display_name: announcementInput.linkDisplayName,
            resource_url: announcementInput.linkUrl,
            updated_by: 'user-id',
            update_date: expect.any(Date),
          },
        });
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { announcement_id: 'announcement-id' },
            data: expect.objectContaining({
              title: announcementInput.title,
              description: announcementInput.description,
              expires_on: announcementInput.expires_on,
              published_on: announcementInput.published_on,
              updated_date: expect.any(Date),
              announcement_status: {
                connect: { code: AnnouncementStatus.Published },
              },
              admin_user_announcement_updated_byToadmin_user: {
                connect: { admin_user_id: 'user-id' },
              },
            }),
          }),
        );
      });

      it('should delete resource', async () => {
        mockFindUniqueOrThrow.mockResolvedValue({
          id: 'announcement-id',
          announcement_resource: [
            { announcement_resource_id: 1, resource_type: 'LINK' },
          ],
        });
        const announcementInput: AnnouncementDataType = {
          title: faker.lorem.words(3),
          description: faker.lorem.words(10),
          expires_on: faker.date.recent().toISOString(),
          published_on: faker.date.future().toISOString(),
          status: AnnouncementStatus.Published,
        };
        await AnnouncementService.updateAnnouncement(
          'announcement-id',
          announcementInput,
          'user-id',
        );
        expect(mockHistoryCreate).toHaveBeenCalled();
        expect(mockDeleteResource).toHaveBeenCalledWith({
          where: { announcement_resource_id: 1 },
        });
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { announcement_id: 'announcement-id' },
            data: expect.objectContaining({
              title: announcementInput.title,
              description: announcementInput.description,
              expires_on: announcementInput.expires_on,
              published_on: announcementInput.published_on,
              updated_date: expect.any(Date),
              announcement_status: {
                connect: { code: AnnouncementStatus.Published },
              },
              admin_user_announcement_updated_byToadmin_user: {
                connect: { admin_user_id: 'user-id' },
              },
            }),
          }),
        );
      });
    });

    describe('without existing link resource', () => {
      it('should update announcement and create resource', async () => {
        mockFindUniqueOrThrow.mockResolvedValue({
          id: 'announcement-id',
          announcement_resource: [],
        });
        const announcementInput: AnnouncementDataType = {
          title: faker.lorem.words(3),
          description: faker.lorem.words(10),
          expires_on: faker.date.recent().toISOString(),
          published_on: faker.date.future().toISOString(),
          status: AnnouncementStatus.Published,
          linkDisplayName: faker.lorem.words(3),
          linkUrl: faker.internet.url(),
        };
        await AnnouncementService.updateAnnouncement(
          'announcement-id',
          announcementInput,
          'user-id',
        );
        expect(mockHistoryCreate).toHaveBeenCalled();
        expect(mockCreateResource).toHaveBeenCalledWith({
          data: {
            display_name: announcementInput.linkDisplayName,
            resource_url: announcementInput.linkUrl,
            admin_user_announcement_resource_created_byToadmin_user: {
              connect: { admin_user_id: 'user-id' },
            },
            admin_user_announcement_resource_updated_byToadmin_user: {
              connect: { admin_user_id: 'user-id' },
            },
            announcement: {
              connect: {
                announcement_id: 'announcement-id',
              },
            },
            announcement_resource_type: {
              connect: { code: 'LINK' },
            },
          },
        });
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { announcement_id: 'announcement-id' },
            data: expect.objectContaining({
              title: announcementInput.title,
              description: announcementInput.description,
              expires_on: announcementInput.expires_on,
              published_on: announcementInput.published_on,
              updated_date: expect.any(Date),
              announcement_status: {
                connect: { code: AnnouncementStatus.Published },
              },
              admin_user_announcement_updated_byToadmin_user: {
                connect: { admin_user_id: 'user-id' },
              },
            }),
          }),
        );
      });
    });
    describe('with existing attachment resource', () => {
      it('should update announcement and resource', async () => {
        const attachmentId = faker.string.uuid();
        mockFindUniqueOrThrow.mockResolvedValue({
          id: 'announcement-id',
          announcement_resource: [
            {
              announcement_resource_id: attachmentId,
              resource_type: 'ATTACHMENT',
            },
          ],
        });
        const announcementInput: AnnouncementDataType = {
          title: faker.lorem.words(3),
          description: faker.lorem.words(10),
          expires_on: faker.date.recent().toISOString(),
          published_on: faker.date.future().toISOString(),
          status: AnnouncementStatus.Published,
          attachmentId: attachmentId,
          fileDisplayName: faker.lorem.words(3),
        };
        await AnnouncementService.updateAnnouncement(
          'announcement-id',
          announcementInput,
          'user-id',
        );
        expect(mockHistoryCreate).toHaveBeenCalled();
        expect(mockUpdateResource).toHaveBeenCalledWith({
          where: { announcement_resource_id: attachmentId },
          data: {
            display_name: announcementInput.fileDisplayName,
            attachment_file_id: announcementInput.attachmentId,
            updated_by: 'user-id',
            update_date: expect.any(Date),
          },
        });
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { announcement_id: 'announcement-id' },
            data: expect.objectContaining({
              title: announcementInput.title,
              description: announcementInput.description,
              expires_on: announcementInput.expires_on,
              published_on: announcementInput.published_on,
              updated_date: expect.any(Date),
              announcement_status: {
                connect: { code: AnnouncementStatus.Published },
              },
              admin_user_announcement_updated_byToadmin_user: {
                connect: { admin_user_id: 'user-id' },
              },
            }),
          }),
        );
      });

      describe("and attachmentId is not provided in the input", () => {
        it("should set attachment id to null", async () => {
          const attachmentId = faker.string.uuid();
          mockFindUniqueOrThrow.mockResolvedValue({
            id: 'announcement-id',
            announcement_resource: [
              {
                announcement_resource_id: attachmentId,
                resource_type: 'ATTACHMENT',
              },
            ],
          });
          const announcementInput: AnnouncementDataType = {
            title: faker.lorem.words(3),
            description: faker.lorem.words(10),
            expires_on: faker.date.recent().toISOString(),
            published_on: faker.date.future().toISOString(),
            status: 'PUBLISHED',
          };
          await updateAnnouncement(
            'announcement-id',
            announcementInput,
            'user-id',
          );
          expect(mockHistoryCreate).toHaveBeenCalled();
          expect(mockUpdateResource).toHaveBeenCalledWith({
            where: { announcement_resource_id: attachmentId },
            data: {
              attachment_file_id: null,
              updated_by: 'user-id',
              update_date: expect.any(Date),
            },
          });
        });
      });
    });

    describe('without existing attachment resource', () => {
      it('should update announcement and create resource', async () => {
        mockFindUniqueOrThrow.mockResolvedValue({
          id: 'announcement-id',
          announcement_resource: [],
        });
        const announcementInput: AnnouncementDataType = {
          title: faker.lorem.words(3),
          description: faker.lorem.words(10),
          expires_on: faker.date.recent().toISOString(),
          published_on: faker.date.future().toISOString(),
          status: AnnouncementStatus.Published,
          attachmentId: faker.string.uuid(),
          fileDisplayName: faker.lorem.word(),
        };
        await AnnouncementService.updateAnnouncement(
          'announcement-id',
          announcementInput,
          'user-id',
        );
        expect(mockHistoryCreate).toHaveBeenCalled();
        expect(mockCreateResource).toHaveBeenCalledWith({
          data: {
            display_name: announcementInput.fileDisplayName,
            attachment_file_id: announcementInput.attachmentId,
            admin_user_announcement_resource_created_byToadmin_user: {
              connect: { admin_user_id: 'user-id' },
            },
            admin_user_announcement_resource_updated_byToadmin_user: {
              connect: { admin_user_id: 'user-id' },
            },
            announcement: {
              connect: {
                announcement_id: 'announcement-id',
              },
            },
            announcement_resource_type: {
              connect: { code: 'ATTACHMENT' },
            },
          },
        });
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { announcement_id: 'announcement-id' },
            data: expect.objectContaining({
              title: announcementInput.title,
              description: announcementInput.description,
              expires_on: announcementInput.expires_on,
              published_on: announcementInput.published_on,
              updated_date: expect.any(Date),
              announcement_status: {
                connect: { code: AnnouncementStatus.Published },
              },
              admin_user_announcement_updated_byToadmin_user: {
                connect: { admin_user_id: 'user-id' },
              },
            }),
          }),
        );
      });
    });

    it('should default to null dates', async () => {
      mockFindUniqueOrThrow.mockResolvedValue({
        id: 'announcement-id',
        announcement_resource: [],
      });
      const announcementInput: AnnouncementDataType = {
        title: faker.lorem.words(3),
        description: faker.lorem.words(10),
        expires_on: '',
        published_on: '',
        status: 'DRAFT',
        linkDisplayName: '',
        linkUrl: '',
      };
      await AnnouncementService.updateAnnouncement(
        'announcement-id',
        announcementInput,
        'user-id',
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { announcement_id: 'announcement-id' },
          data: expect.objectContaining({
            expires_on: null,
            published_on: null,
          }),
        }),
      );
    });
  });

  describe('expireAnnouncement', () => {
    describe('when there are no announcements to expire', () => {
      it('exits without updating any announcements', async () => {
        mockFindMany.mockResolvedValue([]);
        const patchAnnouncementsMock = jest
          .spyOn(AnnouncementService, 'patchAnnouncements')
          .mockImplementation();
        await AnnouncementService.expireAnnouncements();
        expect(mockFindMany).toHaveBeenCalled();
        expect(patchAnnouncementsMock).not.toHaveBeenCalled();
      });
    });
    describe('when there are some announcements to expire', () => {
      it('updates the announcements', async () => {
        mockFindMany.mockResolvedValue([{ announcement_id: '123' }]);
        const patchAnnouncementsMock = jest.spyOn(
          AnnouncementService,
          'patchAnnouncements',
        );
        await AnnouncementService.expireAnnouncements();
        expect(mockFindMany).toHaveBeenCalled();
        expect(patchAnnouncementsMock).toHaveBeenCalled();
      });
    });
  });

  describe('getExpiringAnnouncements', () => {
    it('should return only announcements that will expire', async () => {
      jest
        .spyOn(ZonedDateTime, 'now')
        .mockImplementationOnce((zone) =>
          ZonedDateTime.of(
            LocalDateTime.parse('2024-08-26T11:38:23.561'),
            zone as ZoneId,
          ),
        );
      await AnnouncementService.getExpiringAnnouncements();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          expires_on: {
            gte: new Date('2024-09-05T07:00:00.000Z'),
            lt: new Date('2024-09-06T07:00:00.000Z'),
          },
          status: AnnouncementStatus.Published,
        },
      });
    });
  });

  describe('getAnnouncementById', () => {
    it('should return announcement by id', async () => {
      await AnnouncementService.getAnnouncementById('1');
      expect(mockFindUniqueOrThrow).toHaveBeenCalledWith({
        where: { announcement_id: '1' },
        include: { announcement_resource: true },
      });
    });
  });
});
