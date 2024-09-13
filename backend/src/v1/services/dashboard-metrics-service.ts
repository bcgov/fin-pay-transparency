import prisma from '../prisma/prisma-client';

interface IGetDashboardMetricsInput {
  reportingYear: number;
}

/**
 * Get dashboard metrics
 * @param param0
 * @returns
 */
export const getDashboardMetrics = async ({
  reportingYear,
}: IGetDashboardMetricsInput) => {
  const announcementsData = await prisma.announcement.groupBy({
    where: { status: { in: ['PUBLISHED', 'DRAFT'] } },
    by: ['status'],
    _count: true,
  });
  
  const announcementsMetrics = announcementsData.reduce((acc, curr) => {
    const key = curr.status.toLowerCase();
    return { ...acc, [key]: curr._count };
  }, {});

  const reportsCount = await prisma.pay_transparency_report.count({
    where: {
      reporting_year: reportingYear,
    },
  });
  return {
    announcements: announcementsMetrics,
    reports: {
      count: reportsCount,
    },
  };
};
