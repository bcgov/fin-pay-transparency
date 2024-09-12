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
  const publishedAnnouncements = await prisma.announcement.count({
    where: {
      status: 'PUBLISHED',
    },
  });

  const draftAnnouncements = await prisma.announcement.count({
    where: {
      status: 'DRAFT',
    },
  });

  const reportsCount = await prisma.pay_transparency_report.count({
    where: {
      reporting_year: reportingYear,
    },
  });
  return {
    announcements: {
      published: publishedAnnouncements,
      draft: draftAnnouncements,
    },
    reports: {
      count: reportsCount,
    },
  };
};
