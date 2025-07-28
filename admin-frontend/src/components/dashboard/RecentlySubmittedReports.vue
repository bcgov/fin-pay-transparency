<template>
  <ReportsWidget
    ref="reportsWidget"
    :page-size="pageSize"
    :headers="headers"
    :get-reports="getRecentlySubmittedReports"
  >
    <template #item.update_date="{ item }">
      <span class="date-column">
        <div>{{ formatIsoDateTimeAsLocalDate(item.update_date) }}</div>
        <small class="text-grey-darken-3">{{
          formatIsoDateTimeAsLocalTime(item.update_date)
        }}</small>
      </span>
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
import {
  formatIsoDateTimeAsLocalDate,
  formatIsoDateTimeAsLocalTime,
} from '../../utils/date';
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
    sortable: false,
    key: 'update_date',
  },
  {
    title: 'Employer Name',
    align: 'start',
    sortable: false,
    key: 'pay_transparency_company.company_name',
  },
  {
    title: 'Actions',
    align: 'center',
    sortable: false,
    key: 'actions',
  },
];

async function getRecentlySubmittedReports(): Promise<Report[]> {
  const filter: ReportFilterType = [
    { key: 'report_status', operation: 'eq', value: 'Published' },
  ];
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
