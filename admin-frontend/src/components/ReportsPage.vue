<template>
  <h4>Search Reports</h4>

  <v-row dense class="mt-0 w-100 mb-4">
    <v-col class="py-0 pr-3">
      <ReportSearchFilters />
    </v-col>
  </v-row>

  <div class="search-results w-100">
    <v-row class="mt-0 w-100 mb-3" no-gutters>
      <v-col sm="8" md="8" lg="6" xl="4" class="d-flex align-center">
        <h4 v-if="searchResults?.length">
          Displaying {{ searchResults.length }} report<span
            v-if="searchResults.length != 1"
            >s</span
          >
        </h4>
      </v-col>
      <v-col
        sm="4"
        md="4"
        lg="6"
        xl="8"
        class="d-flex justify-end align-center"
      >
        <v-btn
          class="btn-primary"
          prepend-icon="mdi-export"
          :disabled="!searchResults?.length || isDownloadingCsv"
          :loading="isDownloadingCsv"
          @click="exportResults()"
        >
          Export Results (CSV)
        </v-btn>
      </v-col>
    </v-row>

    <v-data-table-server
      v-model:items-per-page="pageSize"
      :headers="headers"
      :items="searchResults"
      :items-length="totalNum"
      :loading="isSearching"
      :items-per-page-options="itemsPerPageOptions"
      search=""
      :no-data-text="
        hasSearched ? 'No reports matched the search criteria' : ''
      "
      @update:options="updateSearch"
    >
      <template #[`item.create_date`]="{ item }">
        {{ formatDate(item.create_date) }}
      </template>
      <template #[`item.actions`]="{ item }">
        <ReportActions :report="item"></ReportActions>
      </template>
    </v-data-table-server>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, onMounted, onUnmounted } from 'vue';
import ReportSearchFilters from './ReportSearchFilters.vue';
import { useReportSearchStore } from '../store/modules/reportSearchStore';
import { ReportKeys } from '../types/reports';
import { formatDate } from '../utils/date';
import ReportActions from './reports/ReportActions.vue';
import {
  ReportChangeService,
  ReportChangedEventPayload,
} from '../services/reportChangeService';
import type { VDataTableServer } from 'vuetify/components';

const reportSearchStore = useReportSearchStore();
const {
  searchResults,
  isSearching,
  hasSearched,
  totalNum,
  pageSize,
  lastSubmittedReportSearchParams,
  isDownloadingCsv,
} = storeToRefs(reportSearchStore);
const itemsPerPageOptions = ref([
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
]);

onMounted(() => {
  ReportChangeService.listen(onAnyReportChanged);
});

onUnmounted(() => {
  ReportChangeService.unlisten(onAnyReportChanged);
});

function onAnyReportChanged() {
  repeatSearch();
}

const headers = ref<VDataTableServer['headers']>([
  {
    title: 'Submission Date',
    align: 'start',
    sortable: true,
    key: ReportKeys.CREATE_DATE,
  },
  {
    title: 'Employer Name',
    align: 'start',
    sortable: true,
    key: ReportKeys.COMPANY_NAME,
  },
  {
    title: 'NAICS',
    align: 'start',
    sortable: true,
    key: ReportKeys.NAICS_CODE,
  },
  {
    title: 'Employee Count',
    align: 'start',
    sortable: true,
    key: ReportKeys.EMPLOYEE_COUNT,
  },
  {
    title: 'Year',
    align: 'start',
    sortable: false, //not currently supported by backend
    key: ReportKeys.REPORTING_YEAR,
  },
  {
    title: 'Actions',
    key: 'actions',
    align: 'start',
    sortable: false,
  },
]);

async function updateSearch(options) {
  await reportSearchStore.updateSearch(options);
}

async function repeatSearch() {
  await reportSearchStore.repeatSearch();
}

function exportResults() {
  if (lastSubmittedReportSearchParams.value) {
    reportSearchStore.downloadReportsCsv(lastSubmittedReportSearchParams.value);
  }
}
</script>

<style>
.v-data-table-header__content {
  font-weight: bold !important;
}
button:disabled.v-btn.v-btn--loading {
  color: #000000 !important;
}
</style>
