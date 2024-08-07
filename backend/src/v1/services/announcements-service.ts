import { convert, LocalDate, ZoneId } from '@js-joda/core';
import { announcement, Prisma } from '@prisma/client';
import prisma from '../prisma/prisma-client';
import { PaginatedResult } from '../types';
import {
  AnnouncementQueryType,
  CreateAnnouncementType,
  PatchAnnouncementsType,
} from '../types/announcements';
import isEmpty from 'lodash/isEmpty';

const buildAnnouncementWhereInput = (query: AnnouncementQueryType) => {
  const where: Prisma.announcementWhereInput = {};

  if (query.filters) {
    (query.filters as any[]).forEach((filter) => {
      switch (filter.key) {
        case 'published_on':
        case 'expires_on':
          where[filter.key] = { gte: filter.value[0], lt: filter.value[1] };
          break;
        case 'status':
          where.status =
            filter.operation === 'in'
              ? { in: filter.value }
              : { not: { in: filter.value } };
          break;
        case 'title':
          where.title = { contains: filter.value, mode: 'insensitive' };
          break;
      }
    });
  }
  return where;
};

const buildAnnouncementSortInput = (query: AnnouncementQueryType) => {
  const sort: Prisma.announcementOrderByWithRelationInput[] = [];
  if (query.sort) {
    (query.sort as any[]).forEach((sortField) => {
      sort.push({ [sortField.field]: sortField.order });
    });
  }
  return sort;
};

const DEFAULT_PAGE_SIZE = 10;

/**
 * Get announcements based on query parameters
 * @param query
 * @returns
 */
export const getAnnouncements = async (
  query: AnnouncementQueryType = {},
): Promise<PaginatedResult<announcement>> => {
  const where = buildAnnouncementWhereInput(query);
  const orderBy = buildAnnouncementSortInput(query);
  const items = await prisma.announcement.findMany({
    where,
    orderBy,
    take: query.limit || DEFAULT_PAGE_SIZE,
    skip: query.offset || 0,
    include: {
      announcement_resource: true,
    }
  });
  const total = await prisma.announcement.count({ where });

  return {
    items,
    total,
    limit: query.limit || DEFAULT_PAGE_SIZE,
    offset: query.offset || 0,
    totalPages: Math.ceil(total / (query.limit || DEFAULT_PAGE_SIZE)),
  };
};

/**
 * Patch announcements by ids
 * @param data - array of announcement ids to delete
 * @param userId - user id who is deleting the announcements
 */
export const patchAnnouncements = async (
  data: PatchAnnouncementsType,
  userId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const ids = data.map((item) => item.id);
    const announcements = await tx.announcement.findMany({
      where: { announcement_id: { in: data.map((item) => item.id) } },
      include: { announcement_resource: true },
    });

    for (const announcement of announcements) {
      //exclude the 'announcement_resource' attribute from
      //the new announcement_history record
      const announcement_history = { ...announcement };
      delete announcement_history.announcement_resource;

      await tx.announcement_history.create({
        data: {
          ...announcement_history,
          announcement_resource_history: {
            createMany: {
              data: announcement.announcement_resource.map((resource) => ({
                ...resource,
              })),
            },
          },
        },
      });
    }

    const updateDate = LocalDate.now(ZoneId.UTC);
    await tx.announcement.updateMany({
      data: {
        status: 'DELETED',
        updated_by: userId,
        updated_date: convert(updateDate).toDate(),
      },
      where: { announcement_id: { in: ids } },
    });
  });
};

/**
 * Create announcement
 * @param data - announcement data
 */
export const createAnnouncement = async (
  input: CreateAnnouncementType,
  currentUserId: string,
) => {
  const data: Prisma.announcementCreateInput = {
    title: input.title,
    description: input.description,
    announcement_status: {
      connect: { code: input.status },
    },
    published_on: !isEmpty(input.published_on) ? input.published_on : undefined,
    expires_on: !isEmpty(input.expires_on) ? input.expires_on : undefined,
    admin_user_announcement_created_byToadmin_user: {
      connect: { admin_user_id: currentUserId },
    },
    admin_user_announcement_updated_byToadmin_user: {
      connect: { admin_user_id: currentUserId },
    },
    announcement_resource: input.linkUrl
      ? {
          createMany: {
            data: [
              {
                display_name: input.linkDisplayName,
                resource_url: input.linkUrl,
                resource_type: 'LINK',
                created_by: currentUserId,
                updated_by: currentUserId,
              },
            ],
          },
        }
      : undefined,
  };

  return prisma.announcement.create({
    data,
  });
};
