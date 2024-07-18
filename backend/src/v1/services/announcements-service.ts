import { announcement, Prisma } from '@prisma/client';
import { AnnouncementQueryType } from '../types/announcements';
import prisma from '../prisma/prisma-client';

const buildAnnouncementWhereInput = (query: AnnouncementQueryType) => {
  const where: Prisma.announcementWhereInput = {};
  if (query.search) {
    where.title = { contains: query.search, mode: 'insensitive' };
  }
  if (query.filters) {
    query.filters.forEach((filter) => {
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
      }
    });
  }
  return where;
};

const buildAnnouncementSortInput = (query: AnnouncementQueryType) => {
  const sort: Prisma.announcementOrderByWithRelationInput[] = [];
  if (query.sort) {
    query.sort.forEach((sortField) => {
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
): Promise<announcement[]> => {
  const where = buildAnnouncementWhereInput(query);
  const orderBy = buildAnnouncementSortInput(query);
  return prisma.announcement.findMany({
    where,
    orderBy,
    take: query.limit || DEFAULT_PAGE_SIZE,
    skip: query.offset || 0,
  });
};
