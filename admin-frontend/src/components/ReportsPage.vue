<template>
  <h4>Search Reports</h4>

  <v-row dense class="mt-0 w-100 mb-4">
    <v-col class="py-0">
      <ReportSearchFilters />
    </v-col>
  </v-row>

  <div class="search-results w-100" v-if="searchResults">
    <v-row class="mt-0 w-100" no-gutters>
      <v-col sm="8" md="8" lg="6" xl="4" class="d-flex align-center">
        <h4>
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
          @click="exportResults()"
        >
          Export results
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
      no-data-text="No reports matched the search criteria"
      @update:options="updateSearch"
    >
      <template v-slot:item.update_date="{ item }">
        {{ formatSubmissionDate(item.update_date) }}
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn
          density="compact"
          variant="plain"
          icon="mdi-file-pdf-box"
          :loading="isDownloadingPdf(item.report_id)"
          :disabled="isDownloadingPdf(item.report_id)"
          @click="viewReportInNewTab(item.report_id)"
        ></v-btn>
        <v-btn
          density="compact"
          variant="plain"
          :icon="item.is_unlocked ? 'mdi-lock-open' : 'mdi-lock'"
          :color="item.is_unlocked ? 'success' : 'error'"
          @click="lockUnlockReport(item.report_id, !item?.is_unlocked)"
        ></v-btn>
      </template>
    </v-data-table-server>
  </div>

  <!-- dialogs -->
  <ConfirmationDialog ref="confirmDialog"> </ConfirmationDialog>
</template>

<script lang="ts">
export default {
  name: 'Reports',
};
</script>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import ReportSearchFilters from './ReportSearchFilters.vue';
import { useReportSearchStore } from '../store/modules/reportSearchStore.ts';
import { ReportKeys } from '../types';
import ApiService from '../services/apiService';
import { LocalDate, DateTimeFormatter } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import ConfirmationDialog from './util/ConfirmationDialog.vue';

const displayDateFormatter = DateTimeFormatter.ofPattern(
  'MMM dd, yyyy',
).withLocale(Locale.CANADA);

const reportsCurrentlyBeingDownloaded = ref({});
const reportSearchStore = useReportSearchStore();
const { searchResults, isSearching, totalNum, pageSize } =
  storeToRefs(reportSearchStore);
const confirmDialog = ref<typeof ConfirmationDialog>();
const itemsPerPageOptions = ref([
  { value: 1, title: '1' },
  { value: 2, title: '2' },
  { value: 10, title: '10' },
  { value: 20, title: '20' },
  { value: 40, title: '40' },
]);

const headers = ref([
  {
    title: 'Submission date',
    align: 'start',
    sortable: true,
    key: ReportKeys.UPDATE_DATE,
  },
  {
    title: 'Company name',
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
    title: 'Employee count',
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

async function lockUnlockReport(reportId: string, makeUnlocked: boolean) {
  const lockText = makeUnlocked ? 'unlock' : 'lock';
  const isConfirmed = await confirmDialog.value?.open(
    `${lockText} report`,
    `Are you sure you want to ${lockText} the report?`,
    {
      titleBold: true,
      resolveText: `Yes, ${lockText}`,
    },
  );
  if (isConfirmed) {
    await ApiService.lockUnlockReport(reportId, makeUnlocked);
    await repeatSearch();
  }
}

/*
Downloads a PDF report with the given reportId, and opens it in a new tab
(or a new window, depending on how the browser is configured).
*/
async function viewReportInNewTab(reportId: string) {
  setReportDownloadInProgress(reportId);
  const pdfAsBlob = await ApiService.getPdfReportAsBlob(reportId);
  clearReportDownloadInProgress(reportId);
  const objectUrl = URL.createObjectURL(pdfAsBlob);
  window.open(objectUrl);
}

function setReportDownloadInProgress(reportId: string) {
  reportsCurrentlyBeingDownloaded.value[reportId] = true;
}

function clearReportDownloadInProgress(reportId: string) {
  delete reportsCurrentlyBeingDownloaded.value[reportId];
}

function isDownloadingPdf(reportId: string) {
  return reportsCurrentlyBeingDownloaded.value.hasOwnProperty(reportId);
}

function exportResults() {
  console.log('Todo: implement export');
}

/*
Converts a date/time string of one format into another format.
The incoming and outgoing formats can be specified with Joda
DateTimeFormatter objects passed as parameters.
*/
function formatSubmissionDate(
  inDateStr: string,
  inFormatter = DateTimeFormatter.ISO_DATE_TIME,
  outFormatter = displayDateFormatter,
) {
  const jodaLocalDate = LocalDate.parse(inDateStr, inFormatter);
  return outFormatter.format(jodaLocalDate);
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
