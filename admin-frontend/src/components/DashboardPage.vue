<template>
  <v-row v-if="isDashboardAvailable" :dense="true" class="w-100">
    <v-col sm="12" md="12" lg="7" xl="6">
      <h4 class="mb-4">
        <v-icon icon="mdi-clipboard-text-outline"></v-icon>
        Recently Submitted Reports
        <ToolTip
          :text="
            'The 5 most recent submissions, refreshed every ' +
            refreshIntervalMinutes +
            ' minutes.'
          "
          :aria-label="
            'The 5 most recent submissions, refreshed every ' +
            refreshIntervalMinutes +
            ' minutes.'
          "
          max-width="300px"
        ></ToolTip>
      </h4>
      <RecentlySubmittedReports ref="recentlySubmittedReports" />
    </v-col>
    <v-col sm="12" md="12" lg="5" xl="4">
      <h4 class="mb-4">
        <v-icon icon="mdi-chart-box-outline"></v-icon>
        Analytics Overview
      </h4>
      <v-row :dense="true">
        <v-col>
          <NumSubmissionsThisYear></NumSubmissionsThisYear>
        </v-col>
        <v-col>
          <NumEmployerLogins></NumEmployerLogins>
        </v-col>
      </v-row>
    </v-col>
    <v-col sm="12" md="12" lg="7" xl="6">
      <h4 class="mb-4">
        <v-icon icon="mdi-eye-outline"></v-icon>
        Recently Viewed Reports
      </h4>
      <RecentlyViewedReports ref="recentlyViewedReports" />
    </v-col>
    <v-col sm="12" md="12" lg="5" xl="4">
      <h4 class="mb-4">
        <v-icon icon="mdi-bullhorn"></v-icon>
        Public Announcements
      </h4>
      <PublicAnnouncements></PublicAnnouncements>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import RecentlySubmittedReports from './dashboard/RecentlySubmittedReports.vue';
import RecentlyViewedReports from './dashboard/RecentlyViewedReports.vue';
import NumSubmissionsThisYear from './dashboard/NumSubmissionsThisYear.vue';
import NumEmployerLogins from './dashboard/NumEmployerLogins.vue';
import PublicAnnouncements from './dashboard/PublicAnnouncements.vue';
import ToolTip from './ToolTip.vue';
import { ref, onMounted } from 'vue';

const refreshIntervalMinutes: number = 5;
const isDashboardAvailable =
  (window as any).config?.IS_ADMIN_DASHBOARD_AVAILABLE?.toUpperCase() == 'TRUE';

const recentlySubmittedReports = ref<typeof RecentlySubmittedReports>();
const recentlyViewedReports = ref<typeof RecentlyViewedReports>();

onMounted(() => {
  //Periodically refresh the widgets
  setInterval(() => {
    refresh();
  }, refreshIntervalMinutes * 60000);
});

async function refresh() {
  await recentlySubmittedReports.value?.refresh();
  await recentlyViewedReports.value?.refresh();
}
</script>
