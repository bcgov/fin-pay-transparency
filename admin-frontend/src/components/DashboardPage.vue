<template>
  <v-row :dense="true" class="w-100">
    <v-col sm="12" md="12" lg="7" xl="6">
      <h4 class="mb-4">
        <v-icon icon="mdi-clipboard-text-outline"></v-icon>
        Recently Submitted Reports
      </h4>
      <RecentlySubmittedReports />
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
      <RecentlyViewedReports />
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
</script>

<style></style>
