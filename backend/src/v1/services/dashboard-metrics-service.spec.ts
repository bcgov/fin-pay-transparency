describe('dashboard-metrics-service', () => {
  describe('getDashboardMetrics', () => {
    it('should return the dashboard metrics', async () => {
      // Arrange
      const reportingYear = 2021;
      const publishedAnnouncements = 1;
      const draftAnnouncements = 2;
      const reportsCount = 3;
      const prismaMock = {
        announcement: {
          count: jest.fn().mockResolvedValueOnce(publishedAnnouncements).mockResolvedValueOnce(draftAnnouncements),
        },
        pay_transparency_report: {
          count: jest.fn().mockResolvedValueOnce(reportsCount),
        },
      };
      jest.mock('../prisma/prisma-client', () => prismaMock);
      const { getDashboardMetrics } = await import('./dashboard-metrics-service');

      // Act
      const result = await getDashboardMetrics({ reportingYear });

      // Assert
      expect(result).toEqual({
        announcements: {
          published: publishedAnnouncements,
          draft: draftAnnouncements,
        },
        reports: {
          count: reportsCount,
        },
      });
    });
  });
})