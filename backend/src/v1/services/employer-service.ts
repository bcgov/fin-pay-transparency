import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import {
  EmployerFilterType,
  EmployerKeyEnum,
  EmployerMetrics,
  EmployerSortType,
  IEmployerSearchResult,
} from '../types/employers';
import { Prisma } from '@prisma/client';
import { ChronoUnit, convert, ZonedDateTime, ZoneId } from '@js-joda/core';
import '@js-joda/timezone';

export const employerService = {
  /**
   * Get employer metrics
   * @returns EmployerMetrics
   */
  async getEmployerMetrics(): Promise<EmployerMetrics> {
    const numEmployers =
      await prismaReadOnlyReplica.pay_transparency_company.count();
    // Get start and end of current year in PST, then convert to UTC
    const yearStartPst = ZonedDateTime.now(ZoneId.of('America/Vancouver'))
      .withDayOfYear(1)
      .truncatedTo(ChronoUnit.DAYS);
    const yearEndPst = yearStartPst.plusYears(1);
    const numEmployersThisYear =
      await prismaReadOnlyReplica.pay_transparency_company.count({
        where: {
          create_date: {
            gte: convert(yearStartPst.withZoneSameInstant(ZoneId.UTC)).toDate(),
            lt: convert(yearEndPst.withZoneSameInstant(ZoneId.UTC)).toDate(),
          },
        },
      });
    return {
      num_employers_logged_on_to_date: numEmployers,
      num_employers_logged_on_this_year: numEmployersThisYear,
    };
  },

  /**   */
  async getEmployer(
    limit: number = 1000,
    offset: number = 0,
    sort: EmployerSortType = [{ field: 'company_name', order: 'asc' }],
    query: EmployerFilterType = [],
  ): Promise<IEmployerSearchResult> {
    const where: Prisma.pay_transparency_companyWhereInput = {};
    for (const q of query) {
      if (q.key == EmployerKeyEnum.Year) {
        const dates: Prisma.pay_transparency_companyWhereInput[] = [];
        for (const year of q.value) {
          const date = ZonedDateTime.of(year, 1, 1, 0, 0, 0, 0, ZoneId.UTC);
          dates.push({
            create_date: {
              gte: convert(date).toDate(),
              lt: convert(date.plusYears(1)).toDate(),
            },
          });
        }
        where['OR'] = dates;
      } else if (q.key == EmployerKeyEnum.Name) {
        where['company_name'] = { contains: q.value, mode: 'insensitive' };
      } else if (q.key == EmployerKeyEnum.Date) {
        where['create_date'] = {
          gte: new Date(q.value[0]),
          lte: new Date(q.value[1]),
        };
      }
    }

    const orderBy: Prisma.pay_transparency_companyOrderByWithRelationInput[] =
      [];
    for (const s of sort) {
      if (s.field == 'create_date') orderBy.push({ create_date: s.order });
      else orderBy.push({ company_name: s.order });
    }

    const result =
      await prismaReadOnlyReplica.pay_transparency_company.findMany({
        select: {
          company_id: true,
          company_name: true,
          create_date: true,
        },
        where: where,
        orderBy: orderBy,
        take: limit,
        skip: offset,
      });

    const count = await prismaReadOnlyReplica.pay_transparency_company.count({
      where,
    });

    return {
      employers: result,
      total: count,
      totalPages: Math.ceil(count / limit),
      limit,
      offset,
    };
  },
};
