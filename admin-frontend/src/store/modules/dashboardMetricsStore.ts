import { defineStore } from 'pinia';
import { ref } from 'vue';
import ApiService from '../../services/apiService';

interface AnnouncementMetrics {
  draft: { count: number };
  published: { count: number };
}

const useDashboardMetricsStore = defineStore('dashboardMetrics', () => {
  const announcementMetricsLoading = ref<boolean>(false);
  const announcementsMetrics = ref<AnnouncementMetrics | undefined>(undefined);

  const getAnnouncementMetrics = async () => {
    try {
      announcementMetricsLoading.value = true;
      const data = await ApiService.getAnnouncementsMetrics();
      announcementsMetrics.value = data;
    } catch (err) {
      console.log(`get announcements metrics failed: ${err}`);
    } finally {
      announcementMetricsLoading.value = false;
    }
  };

  const reset = () => {
    announcementMetricsLoading.value = false;
    announcementsMetrics.value = undefined;
  };

  return {
    //state
    announcementMetricsLoading,
    announcementsMetrics,
    //actions
    getAnnouncementMetrics,
    reset,
  };
});

export default useDashboardMetricsStore;
