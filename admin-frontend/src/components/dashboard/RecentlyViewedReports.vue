<template>
  <ReportsWidget
    :page-size="pageSize"
    :headers="headers"
    :get-reports="getRecentlyViewedReports"
  >
    <template #item.admin_last_access_date="{ item }">
      {{ formatIsoDateTimeAsLocalDate(item.admin_last_access_date) }}
    </template>
  </ReportsWidget>
</template>

<script setup lang="ts">
import {
  ReportFilterType,
  IReportSearchResult,
  IReportSearchSort,
  Report,
} from '../../types/reports';
import ReportsWidget from './ReportsWidget.vue';
import ApiService from '../../services/apiService';
import { formatIsoDateTimeAsLocalDate } from '../../utils/date';

const pageSize = 5;

const headers = [
  {
    title: 'Viewed On',
    align: 'start',
    sortable: true,
    key: 'admin_last_access_date',
  },
  {
    title: 'Company Name',
    align: 'start',
    sortable: true,
    key: 'pay_transparency_company.company_name',
  },
  {
    title: 'Actions',
    align: 'start',
    sortable: false,
    key: 'actions',
  },
];

async function getRecentlyViewedReports(): Promise<Report[]> {
  const filter: ReportFilterType = [
    { key: 'admin_last_access_date', operation: 'not', value: null },
  ];
  const sort: IReportSearchSort = [{ admin_last_access_date: 'desc' }];
  const searchResults: IReportSearchResult = await ApiService.getReports(
    0,
    pageSize,
    filter,
    sort,
  );
  return searchResults.reports;
}
</script>
