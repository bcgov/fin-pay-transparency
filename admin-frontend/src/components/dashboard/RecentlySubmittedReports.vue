<template>
  <ReportsWidget
    ref="reportsWidget"
    :page-size="pageSize"
    :headers="headers"
    :get-reports="getRecentlySubmittedReports"
  >
    <template #item.update_date="{ item }">
      {{ formatIsoDateTimeAsLocalDate(item.update_date) }}
    </template>
  </ReportsWidget>
</template>

<script lang="ts">
export default {
  name: 'RecentlySubmittedReports',
};
</script>
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
import { ref } from 'vue';

const pageSize = 5;
const reportsWidget = ref<typeof ReportsWidget>();

defineExpose({
  refresh,
});

const headers = [
  {
    title: 'Submission Date',
    align: 'start',
    sortable: true,
    key: 'update_date',
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
  const sort: IReportSearchSort = [{ update_date: 'desc' }];
  const searchResults: IReportSearchResult = await ApiService.getReports(
    0,
    pageSize,
    filter,
    sort,
  );
  return searchResults.reports;
}

async function refresh() {
  await reportsWidget.value?.refresh();
}
</script>
