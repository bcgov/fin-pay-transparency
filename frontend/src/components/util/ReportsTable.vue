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
    <template #headers="{ columns }">
      <tr>
        <template v-for="column in columns" :key="column.key">
          <th v-if="column.key === 'report_url'" class="text-left pa-4">
            <div class="d-flex flex-column align-start">
              <span>{{ column.title }}</span>
              <span
                class="text-caption font-weight-regular text-none d-block opacity-80"
              >
                We invite you to share your most recent report link with our
                office for compliance tracking
              </span>
            </div>
          </th>
          <th v-else-if="column.key === 'actions'" class="text-center pa-4">
            {{ column.title }}
          </th>
          <th v-else class="text-left pa-4">
            {{ column.title }}
          </th>
        </template>
      </tr>
    </template>

    <template #item="{ item }">
      <tr>
        <td
          :data-testid="`reporting_year-${item.report_id}`"
          class="text-start pa-4"
        >
          {{ item.reporting_year }}
        </td>
        <td
          :data-testid="`report_published_date-${item.report_id}`"
          class="text-start pa-4"
        >
          {{ formatDateTime(item.create_date) }}
        </td>
        <td class="pa-4 text-center">
          <div class="d-flex justify-center align-center">
            <v-btn
              :data-testid="`view-report-${item.report_id}`"
              prepend-icon="mdi-eye-outline"
              variant="text"
              color="link"
              class="px-2"
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
              class="px-2"
              @click="editReport(item)"
            >
              Edit
            </v-btn>
          </div>
        </td>
        <td class="text-left pa-4">
          <template v-if="editingReportId === item.report_id">
            <div class="d-flex align-start w-100 ga-2">
              <div class="flex-grow-1">
                <v-text-field
                  v-model="reportUrl"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="w-100"
                  :error="!!errorMessage"
                  placeholder="https://example.gov.bc.ca/reports"
                />

                <div
                  v-if="errorMessage"
                  class="text-error text-caption px-3 pt-0"
                >
                  {{ errorMessage }}
                </div>
              </div>

              <div class="d-flex align-center ga-1 flex-shrink-0">
                <v-btn
                  color="primary"
                  size="small"
                  @click="saveReportUrl(item)"
                >
                  Save
                </v-btn>

                <v-btn
                  icon="mdi-close"
                  variant="text"
                  size="small"
                  @click="cancelEditingReportUrl"
                />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="d-flex align-center ga-2 flex-wrap">
              <template v-if="item.report_url">
                <a
                  :href="item.report_url"
                  target="_blank"
                  class="text-decoration-underline"
                >
                  {{ item.report_url }}
                </a>

                <v-btn
                  color="link"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-pencil"
                  @click="startEditingReportUrl(item)"
                >
                  Edit Link
                </v-btn>
              </template>

              <v-btn
                v-else
                color="link"
                variant="text"
                size="small"
                prepend-icon="mdi-link-variant"
                @click="startEditingReportUrl(item)"
              >
                +Add Link
              </v-btn>
            </div>
          </template>
        </td>
      </tr>
    </template>
  </v-data-table>
  <ConfirmationDialog ref="confirmClearUrlDialog" />
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { IReport } from '../../common/types';
import ReportSelectionManager from './DasboardReportManager.vue';
import { REPORT_STATUS, MAX_REPORT_URL_LEN } from '../../utils/constant';
import ApiService from '../../common/apiService';
import {
  ReportMode,
  useReportStepperStore,
} from '../../store/modules/reportStepper';
import { useConfigStore } from '../../store/modules/config';
import { DateTimeFormatter, ZonedDateTime, ZoneId } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { useRouter } from 'vue-router';
import ConfirmationDialog from './ConfirmationDialog.vue';

const { setReportInfo, setMode, reset } = useReportStepperStore();
const { loadConfig } = useConfigStore();
const router = useRouter();

const headers: any = [
  {
    title: 'Reporting Year',
    key: 'reporting_year',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Submission Date',
    key: 'update_date',
    sortable: false,
    align: 'start',
  },
  { title: 'Action', sortable: false, key: 'actions', align: 'center' },
  {
    title: 'Link to published report (optional)',
    sortable: false,
    key: 'report_url',
    align: 'start',
  },
];

const reports = ref<IReport[]>([]);
const isLoading = ref(true);
const editingReportId = ref('');
const reportUrl = ref('');
const errorMessage = ref('');
const confirmClearUrlDialog = ref<InstanceType<
  typeof ConfirmationDialog
> | null>(null);

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

const startEditingReportUrl = (report: IReport) => {
  editingReportId.value = report.report_id;
  reportUrl.value = report.report_url ?? '';
  errorMessage.value = '';
};

const cancelEditingReportUrl = () => {
  editingReportId.value = '';
  reportUrl.value = '';
  errorMessage.value = '';
};

const saveReportUrl = async (report: IReport) => {
  errorMessage.value = '';

  const formattedUrl = reportUrl.value.trim();

  // Check if trying to save empty URL without a previous value
  if (!formattedUrl && !report.report_url) {
    errorMessage.value = 'Please enter a URL.';
    return;
  }

  if (!formattedUrl && report.report_url) {
    const confirmed = await confirmClearUrlDialog.value?.open(
      'Remove report link?',
      'Are you sure you want to remove the published report link? This action will remove the current link from this report.',
      {
        titleBold: true,
        resolveText: 'Remove Link',
        rejectText: 'Cancel',
      },
    );

    if (!confirmed) {
      cancelEditingReportUrl();
      return;
    }
  }

  let normalizedUrl: string;

  if (formattedUrl) {
    const strippedUrl = formattedUrl.replace(
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//,
      '',
    );

    normalizedUrl = `https://${strippedUrl}`;
  } else {
    normalizedUrl = '';
  }

  if (!normalizedUrl) {
    await confirmClearUrl(report);
    return;
  }

  const validationError = validateReportUrl(normalizedUrl);

  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  try {
    await ApiService.addOrUpdateReportUrl(
      report.report_id,
      normalizedUrl,
      !!report.report_url,
    );
    report.report_url = normalizedUrl;
    cancelEditingReportUrl();
  } catch (error) {
    errorMessage.value = 'Failed to save URL. Please try again.';
    console.error('Error saving link:', error);
  }
};

const confirmClearUrl = async (report: IReport) => {
  try {
    await ApiService.addOrUpdateReportUrl(report.report_id, '', true);

    report.report_url = '';
    cancelEditingReportUrl();
  } catch (error) {
    errorMessage.value = 'Failed to remove URL. Please try again.';
    console.error('Error removing report link:', error);
  }
};

const validateReportUrl = (url: string): string | null => {
  const trimmedUrl = url.trim();

  if (trimmedUrl.length > MAX_REPORT_URL_LEN) {
    return `URL cannot exceed ${MAX_REPORT_URL_LEN} characters.`;
  }

  if (!hasTLD(trimmedUrl)) {
    return 'Please enter a URL with a valid domain.';
  }

  return null;
};

const hasTLD = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname;
    const lastPeriodIndex = hostname.lastIndexOf('.');
    if (lastPeriodIndex === -1) {
      return false;
    }
    const tldLength = hostname.length - lastPeriodIndex - 1;
    return tldLength >= 2;
  } catch {
    return false;
  }
};
</script>

<style>
.v-data-table-header__content {
  font-weight: 700 !important;
}

.v-data-table-headers--mobile {
  display: none !important;
}

.v-data-table-footer__items-per-page {
  display: none !important;
}
</style>
