<template>
  <ReportsWidget
    ref="reportsWidget"
    :page-size="pageSize"
    :headers="headers"
    :get-reports="getRecentlyViewedReports"
  >
    <template #item.admin_last_access_date="{ item }">
      <span class="date-column">
        <div>
          {{ formatIsoDateTimeAsLocalDate(item.admin_last_access_date) }}
        </div>
        <small class="text-grey-darken-3">{{
          formatIsoDateTimeAsLocalTime(item.admin_last_access_date)
        }}</small>
      </span>
    </template>
  </ReportsWidget>
</template>

<script lang="ts">
export default {
  name: 'RecentlyViewedReports',
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

const headers = [
  {
    title: 'Viewed On',
    align: 'start',
    sortable: false,
    key: 'admin_last_access_date',
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

async function refresh() {
  await reportsWidget.value?.refresh();
}

async function getRecentlyViewedReports(): Promise<Report[]> {
  const filter: ReportFilterType = [
    { key: 'admin_last_access_date', operation: 'not', value: null },
    { key: 'report_status', operation: 'eq', value: 'Published' },
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

defineExpose({
  refresh,
});
</script>
