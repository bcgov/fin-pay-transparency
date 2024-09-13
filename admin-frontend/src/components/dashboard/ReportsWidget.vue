<template>
  <v-card class="ptap-widget">
    <v-card-text class="px-0 py-0">
      <v-data-table-server
        :v-model:items-per-page="props.pageSize"
        :headers="headers"
        :items="reports"
        :loading="isSearching"
        :items-length="reports?.length ? reports.length : 0"
        search=""
        :no-data-text="hasSearched ? 'No reports to show' : ''"
        :hide-default-footer="true"
        @update:options="refresh"
      >
        <template #item.admin_last_access_date="{ item }">
          {{ formatIsoDateTimeAsLocalDate(item.admin_last_access_date) }}
        </template>
        <template #item.actions="{ item }">
          <ReportActions :report="item"></ReportActions>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { Report } from '../../types/reports';
import { ref } from 'vue';
import { formatIsoDateTimeAsLocalDate } from '../../utils/date';
import ReportActions from '../reports/ReportActions.vue';

const props = defineProps<{
  pageSize: string | number | undefined;
  headers: object[];
  getReports: () => Promise<Report[]>;
}>();

const isSearching = ref<boolean>(false);
const hasSearched = ref<boolean>(false);
const reports = ref<Report[]>();

/**
 * Refresh the reports
 */
async function refresh(): Promise<void> {
  isSearching.value = true;
  try {
    reports.value = await props.getReports();
  } catch {
    //fail silently
  } finally {
    isSearching.value = false;
    hasSearched.value = true;
  }
}
</script>

<style>
thead {
  background-color: #eeeeee;
}
</style>
