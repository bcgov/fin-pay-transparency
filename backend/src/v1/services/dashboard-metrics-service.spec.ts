import {
  getAnnouncementMetrics,
  getReportsMetrics,
} from './dashboard-metrics-service';

jest.mock('../prisma/prisma-client', () => ({
  announcement: {
    groupBy: jest.fn().mockResolvedValueOnce([
      { status: 'PUBLISHED', _count: 1 },
      { status: 'DRAFT', _count: 2 },
    ]),
  },
  pay_transparency_report: {
    count: jest.fn().mockResolvedValueOnce(3),
  },
}));

describe('dashboard-metrics-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('getAnnouncementMetrics', () => {
    it('should return the announcement metrics', async () => {

      // Act
      const result = await getAnnouncementMetrics();

      // Assert
      expect(result).toEqual({
        published: { count: 1 },
        draft: { count: 2 },
      });
    });
  });
  describe('getReportMetrics', () => {
    it('should return the reports metrics', async () => {
      // Arrange
      const reportingYear = 2021;
      const result = await getReportsMetrics({ reportingYear });

      // Assert
      expect(result).toEqual({
        reports: {
          count: 3,
        },
      });
    });
  });
});
