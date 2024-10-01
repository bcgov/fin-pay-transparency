<template>
  <v-card class="ptap-widget">
    <v-card-text class="px-0 py-0">
      <v-data-table-server
        :v-model:items-per-page="pageSize"
        :headers="headers"
        :items="reports"
        :loading="isSearching"
        :items-length="reports?.length ? reports.length : 0"
        search=""
        :no-data-text="hasSearched ? 'No reports to show' : ''"
        :hide-default-footer="true"
        @update:options="refresh"
      >
        <template
          v-for="slotName in Object.keys($slots)"
          #[slotName]="{ item }"
        >
          <slot :name="slotName" :item="item">{{ item[slotName] }} </slot>
        </template>

        <template #item.actions="{ item }">
          <ReportActions :report="item"></ReportActions>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
export default {
  name: 'ReportsWidget',
};
</script>
<script setup lang="ts">
/**
 * This is a general-purpose component which displays reports in a table.
 * It provides properties to customize where the reports are fetched from,
 * which columns to include, and how many reports to show.
 * Supports slots with item.<header_key> to provide custom rendering for \
 * certain columns.  Usage example:
 * 
 * <ReportsWidget
    :page-size="pageSize"
    :headers="headers"
    :get-reports="myAsyncFunctionToFetchReports"
  >
    <template #item.admin_last_access_date="{ item }">
      {{ formatDate(item.admin_last_access_date) }}
    </template>
  </ReportsWidget>
 * 
 */

import { Report } from '../../types/reports';
import { ref, onMounted, onUnmounted } from 'vue';
import ReportActions from '../reports/ReportActions.vue';
import {
  ReportChangeService,
  ReportChangedEventPayload,
} from '../../services/reportChangeService';

const props = defineProps<{
  pageSize: string | number | undefined;
  headers: any[];
  getReports: () => Promise<Report[]>;
}>();

const isSearching = ref<boolean>(false);
const hasSearched = ref<boolean>(false);
const reports = ref<Report[]>();

onMounted(() => {
  ReportChangeService.listen(onAnyReportChanged);
});

onUnmounted(() => {
  ReportChangeService.unlisten(onAnyReportChanged);
});

function onAnyReportChanged(payload: ReportChangedEventPayload) {
  refresh();
}

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

defineExpose({
  refresh,
});
</script>

<style>
.ptap-widget thead {
  background-color: #eeeeee;
}
</style>
