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
      search=""
      no-data-text="No reports matched the search criteria"
      @update:options="updateSearch"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn
          density="compact"
          variant="plain"
          icon="mdi-file-pdf-box"
        ></v-btn>
        <v-btn
          density="compact"
          variant="plain"
          :icon="item?.is_unlocked ? 'mdi-lock-open' : 'mdi-lock'"
          :color="item?.is_unlocked ? 'success' : 'error'"
        ></v-btn>
        <v-btn density="compact" variant="plain" icon="mdi-clock"></v-btn>
      </template>
    </v-data-table-server>
  </div>
</template>

<script>
export default {
  name: 'Reports',
};
</script>

<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import ReportSearchFilters from './ReportSearchFilters.vue';
import { useReportSearchStore } from '../store/modules/reportSearchStore.ts';
import { ReportKeys } from '../types';

const reportSearchStore = useReportSearchStore();
const { searchResults, isSearching, totalNum, pageSize } =
  storeToRefs(reportSearchStore);

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
  reportSearchStore.updateSearch(options);
}

function resetSearch() {
  reportSearchStore.reset();
}

function exportResults() {}
</script>

<style>
.v-data-table-header__content {
  font-weight: bold !important;
}
</style>
