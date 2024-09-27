<template>
  <ReportsWidget
    ref="reportsWidget"
    :page-size="pageSize"
    :headers="headers"
    :get-reports="getRecentlyViewedReports"
  >
    <template #item.admin_last_access_date="{ item }">
      {{ formatIsoDateTimeAsLocalDate(item.admin_last_access_date) }}
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
import { formatIsoDateTimeAsLocalDate } from '../../utils/date';
import { ref, onMounted, onUnmounted } from 'vue';
import {
  ReportChangeService,
  ReportChangedEventPayload,
} from '../../services/reportChangeService';

const pageSize = 5;
const reportsWidget = ref<typeof ReportsWidget>();

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

onMounted(() => {
  ReportChangeService.listen(onAnyReportChanged);
});

onUnmounted(() => {
  ReportChangeService.unlisten(onAnyReportChanged);
});

function onAnyReportChanged(payload: ReportChangedEventPayload) {
  console.log(`recentlyViewedReports - onAnyReportChanged`);
  refresh();
}

async function refresh() {
  await reportsWidget.value?.refresh();
}

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

defineExpose({
  refresh,
});
</script>
