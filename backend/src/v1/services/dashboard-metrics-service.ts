import prisma from '../prisma/prisma-client';

interface IGetReportMetricsInput {
  reportingYear: number;
}

/**
 * Get announcement metrics
 * @param param0
 * @returns
 */
export const getAnnouncementMetrics = async () => {
  const announcementsData = await prisma.announcement.groupBy({
    where: { status: { in: ['PUBLISHED', 'DRAFT'] } },
    by: ['status'],
    _count: true,
  });

  const announcementsMetrics = announcementsData.reduce((acc, curr) => {
    const key = curr.status.toLowerCase();
    return { ...acc, [key]: { count: curr._count } };
  }, {});

  return {
    ...announcementsMetrics,
  };
};

/**
 * Get dashboard metrics
 * @param param0
 * @returns
 */
export const getReportsMetrics = async ({
  reportingYear,
}: IGetReportMetricsInput) => {
  const reportsCount = await prisma.pay_transparency_report.count({
    where: {
      reporting_year: reportingYear,
    },
  });
  return {
    reports: {
      count: reportsCount,
    },
  };
};
