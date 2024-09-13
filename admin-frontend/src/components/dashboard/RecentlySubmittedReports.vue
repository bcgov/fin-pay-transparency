<template>
  <ReportsWidget
    :page-size="pageSize"
    :headers="headers"
    :get-reports="getRecentlySubmittedReports"
  />
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

const pageSize = 5;

const headers = [
  {
    title: 'Submission Date',
    align: 'start',
    sortable: true,
    key: 'create_date',
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

async function getRecentlySubmittedReports(): Promise<Report[]> {
  const filter: ReportFilterType = [];
  const sort: IReportSearchSort = [{ create_date: 'desc' }];
  const searchResults: IReportSearchResult = await ApiService.getReports(
    0,
    pageSize,
    filter,
    sort,
  );
  return searchResults.reports;
}
</script>
