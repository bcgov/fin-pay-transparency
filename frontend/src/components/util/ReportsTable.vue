<template>
  <ReportSelectionManager />
  <v-data-table
    :headers="headers"
    :items="reports"
    :items-per-page="3"
    :disable-sort="true"
    no-data-text="No generated reports yet."
    :loading="isLoading"
    loading-text="Loading reports..."
  >
    <template #item="{ item }">
      <tr>
        <td :data-testid="`reporting_year-${item.report_id}`">
          {{ item.reporting_year }}
        </td>
        <td :data-testid="`report_published_date-${item.report_id}`">
          {{ formatDateTime(item.create_date) }}
        </td>
        <td class="actions">
          <v-btn
            :data-testid="`view-report-${item.report_id}`"
            prepend-icon="mdi-eye-outline"
            variant="text"
            color="link"
            @click="viewReport(item)"
          >
            View
          </v-btn>
          <v-btn
            v-if="item.is_unlocked"
            :data-testid="`edit-report-${item.report_id}`"
            prepend-icon="mdi-eye-outline"
            variant="text"
            color="link"
            @click="editReport(item)"
          >
            Edit
          </v-btn>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { IReport } from '../../common/types';
import ReportSelectionManager from './DasboardReportManager.vue';
import { REPORT_STATUS } from '../../utils/constant';
import ApiService from '../../common/apiService';
import {
  ReportMode,
  useReportStepperStore,
} from '../../store/modules/reportStepper';
import { useConfigStore } from '../../store/modules/config';
import { DateTimeFormatter, ZonedDateTime, ZoneId } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { useRouter } from 'vue-router';

const { setReportInfo, setMode, reset } = useReportStepperStore();
const { loadConfig } = useConfigStore();
const router = useRouter();

const headers: any = [
  { title: 'Reporting Year', key: 'reporting_year', sortable: false },
  {
    title: 'Submission Date',
    key: 'update_date',
    sortable: false,
  },
  { title: 'Action', sortable: false, key: 'actions', align: 'end' },
];

const reports = ref<IReport[]>([]);
const isLoading = ref(true);

onBeforeMount(async () => {
  await reset();
  await loadConfig();
  await getReports();
});

const getReports = async () => {
  const items = await ApiService.getReports({
    report_status: REPORT_STATUS.PUBLISHED,
  });

  reports.value = items;
  isLoading.value = false;
};

const formatDateTime = (value: string, format = 'MMMM d, yyyy'): string => {
  const formatter = DateTimeFormatter.ofPattern(format).withLocale(
    Locale.CANADA,
  );
  return ZonedDateTime.parse(value)
    .withZoneSameInstant(ZoneId.SYSTEM)
    .format(formatter);
};

const viewReport = async (report: IReport) => {
  setMode(ReportMode.View);
  await setReportInfo(report);
};
const editReport = async (report: IReport) => {
  setMode(ReportMode.Edit);
  await setReportInfo(report);
  await router.push({ path: 'generate-report-form' });
};
</script>

<style>
.v-data-table-header__content {
  font-weight: 700 !important;
  margin-right: 15px;
}

.v-data-table-headers--mobile {
  display: none !important;
}

.v-data-table-footer__items-per-page {
  display: none !important;
}

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
