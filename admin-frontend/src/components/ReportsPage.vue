<template>
  <h4>Search Reports</h4>

  <v-row class="mt-0 w-100 mb-4">
    <v-col sm="9" md="8" lg="6" xl="4" class="d-flex align-center">
      <v-text-field
        prepend-inner-icon="mdi-magnify"
        density="compact"
        label="Search reports"
        variant="solo"
        hide-details
        single-line
      >
        <template v-slot:append> </template>
      </v-text-field>
      <v-btn class="btn-primary" @click="searchReports()"> Search </v-btn>
    </v-col>
    <v-col sm="3" md="4" lg="6" xl="8" class="d-flex justify-end align-center">
      <v-btn
        class="btn-secondary"
        prepend-icon="mdi-filter"
        :append-icon="isFilterPanelVisible ? 'mdi-arrow-up' : 'mdi-arrow-down'"
        @click="toggleFilterPanelVisible()"
      >
        Filter
      </v-btn>
    </v-col>
  </v-row>

  <v-row class="mt-0 w-100 mb-4" v-if="isFilterPanelVisible">
    <v-col class="py-0">
      <ReportSearchFilters class="extend-to-side-edges" />
    </v-col>
  </v-row>

  <v-row class="mt-0 w-100" no-gutters>
    <v-col sm="8" md="8" lg="6" xl="4" class="d-flex align-center">
      <h4>Displaying ### reports</h4>
    </v-col>
    <v-col sm="4" md="4" lg="6" xl="8" class="d-flex justify-end align-center">
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
    item-value="name"
    @update:options="searchReports"
  >
    <template v-slot:item.actions="{ item }">
      <v-btn density="compact" variant="plain" icon="mdi-file-pdf-box"></v-btn>
      <v-btn
        density="compact"
        variant="plain"
        :icon="item?.is_unlocked ? 'mdi-lock-open' : 'mdi-lock'"
        :color="item?.is_unlocked ? 'success' : 'error'"
      ></v-btn>
      <v-btn density="compact" variant="plain" icon="mdi-clock"></v-btn>
    </template>
  </v-data-table-server>
</template>

<script>
export default {
  name: 'Reports',
};
</script>

<script setup>
import { ref, watch } from 'vue';
import ReportSearchFilters from './ReportSearchFilters.vue';
import ApiService from '../services/apiService';
const isFilterPanelVisible = ref(false);
const isSearching = ref(false);
const pageSize = ref(20);
const headers = ref([
  {
    title: 'Submission date',
    key: 'submissionDate',
    align: 'start',
    sortable: true,
    key: 'update_date',
  },
  {
    title: 'Company name',
    key: 'companyName',
    align: 'start',
    sortable: true,
    key: 'pay_transparency_company.company_name',
  },
  {
    title: 'NAICS',
    key: 'naicsCode',
    align: 'start',
    sortable: true,
    key: 'naics_code',
  },
  {
    title: 'Employee count',
    key: 'employeeCount',
    align: 'start',
    sortable: true,
    key: 'employee_count_range.employee_count_range',
  },
  {
    title: 'Year',
    key: 'reportingYear',
    align: 'start',
    sortable: true,
    key: 'reporting_year',
  },
  {
    title: 'Actions',
    key: 'actions',
    align: 'start',
    sortable: false,
  },
]);
const searchResults = ref();
const totalNum = ref();

function toggleFilterPanelVisible() {
  isFilterPanelVisible.value = !isFilterPanelVisible.value;
}

async function searchReports(options) {
  const defaults = { page: 1, itemsPerPage: 20, sortBy: null };
  options = { ...defaults, ...options };

  const offset = (options.page - 1) * options.itemsPerPage;
  const limit = options.itemsPerPage;
  const filter = [];
  const sort = [];

  isSearching.value = true;
  try {
    const resp = await ApiService.getReports(offset, limit, filter, sort);
    searchResults.value = resp?.reports;
    totalNum.value = resp?.total;
  } catch (err) {
    console.log(`search failed: ${err}`);
  }
  isSearching.value = false;
}

function exportResults() {}
</script>

<style>
.extend-to-side-edges {
  margin-left: -24px;
  margin-right: -48px;
}
</style>
