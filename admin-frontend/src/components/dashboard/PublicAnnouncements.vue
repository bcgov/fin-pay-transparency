<template>
  <v-card class="ptap-widget">
    <v-card-text class="h-100 d-flex flex-column">
      <div class="widget-header flex-grow-0 flex-shrink-0">
        There are {{ announcementsMetrics?.published?.count || 0 }} published
        announcements and {{ announcementsMetrics?.draft?.count || 0 }} draft
        announcements
      </div>
      <div class="d-flex">
        <div
          class="d-flex flex-column justify-center align-center widget-value text-primary flex-grow-1 flex-shrink-0"
        >
          {{ announcementsMetrics?.published?.count || 0 }}
          <AnnouncementStatusChip
            :status="AnnouncementStatus.Published"
            class="ms-2"
          ></AnnouncementStatusChip>
        </div>
        <div
          class="d-flex flex-column justify-center align-center widget-value text-primary flex-grow-1 flex-shrink-0"
        >
          {{ announcementsMetrics?.draft?.count || 0 }}
          <AnnouncementStatusChip
            :status="AnnouncementStatus.Draft"
            class="ms-2"
          ></AnnouncementStatusChip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import AnnouncementStatusChip from '../announcements/AnnouncementStatusChip.vue';
import { AnnouncementStatus } from '../../types/announcements';
import useDashboardMetrics from '../../store/modules/dashboardMetricsStore';
import { storeToRefs } from 'pinia';
import { onBeforeMount, defineExpose } from 'vue';
const dashboardMetrics = useDashboardMetrics();
const { announcementsMetrics } = storeToRefs(dashboardMetrics);

const refresh = async () => {
  await dashboardMetrics.getAnnouncementMetrics();
};

defineExpose({
  refresh,
});

onBeforeMount(async () => {
  await dashboardMetrics.getAnnouncementMetrics();
});
</script>

<style lang="scss">
.widget-header {
  font-size: 1.2em;
}
.widget-value {
  font-size: 6em;
  font-weight: bold;
}
</style>
