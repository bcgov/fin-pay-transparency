<template>
  <v-row :dense="true" class="w-100">
    <v-col sm="12" md="12" lg="7" xl="6" class="mb-4">
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
    <v-col sm="12" md="12" lg="5" xl="4" class="mb-4">
      <h4 class="mb-4">
        <v-icon icon="mdi-chart-box-outline"></v-icon>
        Analytics Overview
      </h4>
      <v-row :dense="true">
        <v-col class="d-flex">
          <NumSubmissionsInYear
            ref="numSubmissionsInYear"
          ></NumSubmissionsInYear>
        </v-col>
        <v-col class="d-flex">
          <NumEmployerLogons ref="numEmployerLogons"></NumEmployerLogons>
        </v-col>
      </v-row>
    </v-col>
    <v-col sm="12" md="12" lg="7" xl="6" class="mb-4">
      <h4 class="mb-4">
        <v-icon icon="mdi-eye-outline"></v-icon>
        Recently Viewed Reports
        <ToolTip
          :text="
            'The 5 most recently viewed reports (by a user of the Admin Portal), refreshed every ' +
            refreshIntervalMinutes +
            ' minutes.'
          "
          :aria-label="
            'The 5 most recently viewed reports (by a user of the Admin Portal), refreshed every ' +
            refreshIntervalMinutes +
            ' minutes.'
          "
          max-width="300px"
        ></ToolTip>
      </h4>
      <RecentlyViewedReports ref="recentlyViewedReports" />
    </v-col>
    <v-col sm="12" md="12" lg="5" xl="4" class="mb-4">
      <h4 class="mb-4 d-flex align-center">
        <v-icon icon="mdi-bullhorn"></v-icon>
        Public Announcements
        <span class="flex-fill"></span>
        <v-btn
          variant="plain"
          to="/announcements"
          class="btn-link d-flex align-center text-subtitle-1"
          size="x-small"
          append-icon="mdi-chevron-right"
          >Go to edit
        </v-btn>
      </h4>
      <PublicAnnouncements ref="publicAnnouncements"></PublicAnnouncements>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import RecentlySubmittedReports from './dashboard/RecentlySubmittedReports.vue';
import RecentlyViewedReports from './dashboard/RecentlyViewedReports.vue';
import NumSubmissionsInYear from './dashboard/NumSubmissionsInYear.vue';
import NumEmployerLogons from './dashboard/NumEmployerLogons.vue';
import PublicAnnouncements from './dashboard/PublicAnnouncements.vue';
import ToolTip from './ToolTip.vue';
import { ref, onMounted } from 'vue';

const refreshIntervalMinutes: number = 5;

const recentlySubmittedReports = ref<typeof RecentlySubmittedReports>();
const recentlyViewedReports = ref<typeof RecentlyViewedReports>();
const numSubmissionsInYear = ref<typeof NumSubmissionsInYear>();
const publicAnnouncements = ref<typeof PublicAnnouncements>();
const numEmployerLogons = ref<typeof NumEmployerLogons>();

onMounted(() => {
  //Periodically refresh the widgets
  setInterval(() => {
    refresh();
  }, refreshIntervalMinutes * 60000);
});

async function refresh() {
  await recentlySubmittedReports.value?.refresh();
  await recentlyViewedReports.value?.refresh();
  await numSubmissionsInYear.value?.refresh();
  await publicAnnouncements.value?.refresh();
  await numEmployerLogons.value?.refresh();
}
</script>
