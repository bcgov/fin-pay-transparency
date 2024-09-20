import { describe, vi, it, beforeEach, expect } from 'vitest';

import { setActivePinia, createPinia } from 'pinia';
import useDashboardMetricsStore from '../dashboardMetricsStore';

const getAnnouncementsMetricsMock = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    getAnnouncementsMetrics: () => {
      return getAnnouncementsMetricsMock();
    },
  },
}));
describe('dashboardMetricsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('announcements metrics', () => {
    it('should return the initial state', () => {
      const store = useDashboardMetricsStore();
      expect(store.announcementMetricsLoading).toBe(false);
      expect(store.announcementsMetrics).toBe(undefined);
    });
  });

  describe('getAnnouncementMetrics', () => {
    it('should get announcements metrics', async () => {
      const store = useDashboardMetricsStore();
      getAnnouncementsMetricsMock.mockResolvedValueOnce({
        draft: { count: 1 },
        published: { count: 2 },
      });
      await store.getAnnouncementMetrics();
      expect(getAnnouncementsMetricsMock).toHaveBeenCalled();
    });

    describe('when getAnnouncementMetrics fails', () => {
      it('should set announcementMetricsLoading to false', async () => {
        const store = useDashboardMetricsStore();
        getAnnouncementsMetricsMock.mockRejectedValueOnce('error');
        await store.getAnnouncementMetrics();
        expect(store.announcementMetricsLoading).toBe(false);
      });
    });
  });

  describe('reset', () => {
    it('should reset the store', () => {
      const store = useDashboardMetricsStore();
      store.announcementMetricsLoading = true;
      store.announcementsMetrics = {
        draft: { count: 1 },
        published: { count: 2 },
      };
      store.reset();
      expect(store.announcementMetricsLoading).toBe(false);
      expect(store.announcementsMetrics).toBe(undefined);
    });
  });
});
