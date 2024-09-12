<template>
  <v-card class="ptap-widget">
    <v-card-text class="px-0 py-0">
      <v-data-table-server
        v-model:items-per-page="pageSize"
        :headers="headers"
        :items="reports"
        :loading="isSearching"
        :items-length="reports?.length ? reports.length : 0"
        search=""
        :no-data-text="hasSearched ? 'No reports to show' : ''"
        :hide-default-footer="true"
        @update:options="updateSearch"
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
import {
  ReportFilterType,
  IReportSearchResult,
  IReportSearchSort,
  Report,
} from '../../types/reports';
import { ref } from 'vue';
import { formatIsoDateTimeAsLocalDate } from '../../utils/date';
import ReportActions from '../reports/ReportActions.vue';
import ApiService from '../../services/apiService';

const isSearching = ref<boolean>(false);
const hasSearched = ref<boolean>(false);
const reports = ref<Report[]>();
const pageSize = 5;

type AlignType = 'start' | 'center' | 'end';

const headers = [
  {
    title: 'Viewed On',
    align: 'start' as AlignType,
    sortable: true,
    key: 'admin_last_access_date',
  },
  {
    title: 'Company Name',
    align: 'start' as AlignType,
    sortable: true,
    key: 'pay_transparency_company.company_name',
  },
  {
    title: 'Actions',
    align: 'start' as AlignType,
    sortable: false,
    key: 'actions',
  },
];

/**
 * Fetch the most recently updated reports
 */
async function updateSearch(): Promise<void> {
  isSearching.value = true;
  const filter: ReportFilterType = [
    { key: 'admin_last_access_date', operation: 'not', value: null },
  ];
  const sort: IReportSearchSort = [{ admin_last_access_date: 'desc' }];
  try {
    const searchResults: IReportSearchResult = await ApiService.getReports(
      0,
      pageSize,
      filter,
      sort,
    );
    reports.value = searchResults.reports;
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
