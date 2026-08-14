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
          <th v-if="column.key === 'report_url'" class="report-url-header">
            <div class="column-header-with-subtitle">
              <span>{{ column.title }}</span>
              <span class="column-header-subtitle">
                We invite you to share your most recent report link with our
                office for compliance tracking
              </span>
            </div>
          </th>
          <th v-else>
            {{ column.title }}
          </th>
        </template>
      </tr>
    </template>

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
        <td>
          <template v-if="editingReportId === item.report_id">
            <div class="link-editor-container">
              <div class="link-editor">
                <v-text-field
                  v-model="reportUrl"
                  density="compact"
                  hide-details="auto"
                  counter
                  :error="!!errorMessage"
                  :error-messages="errorMessage"
                  placeholder="https://example.gov.bc.ca/reports"
                />

                <v-btn color="link" size="small" @click="saveReportUrl(item)">
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
            <div class="link-display">
              <template v-if="item.report_url">
                <a :href="item.report_url" target="_blank">
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
  { title: 'Reporting Year', key: 'reporting_year', sortable: false },
  {
    title: 'Submission Date',
    key: 'update_date',
    sortable: false,
  },
  { title: 'Action', sortable: false, key: 'actions', align: 'end' },
  {
    title: 'Link to published report (optional)',
    sortable: false,
    key: 'report_url',
    align: 'end',
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
    if (formattedUrl.startsWith('https://')) {
      normalizedUrl = formattedUrl;
    } else if (formattedUrl.startsWith('http://')) {
      normalizedUrl = `https://${formattedUrl.substring('http://'.length)}`;
    } else {
      normalizedUrl = `https://${formattedUrl}`;
    }
  } else {
    normalizedUrl = '';
  }

  const validationError = validateReportUrl(normalizedUrl);

  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  try {
    if (!normalizedUrl) {
      await confirmClearUrl(report);
      return;
    }

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

  return null;
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

.report-url-header {
  text-align: left;
}

.column-header-with-subtitle {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  line-height: 1.3;
  width: 100%;
}

.column-header-subtitle {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
  text-transform: none;
  line-height: 1.4;
  display: block;
}

.link-editor {
  display: flex;
  gap: 8px;
  align-items: center;
}

.link-editor-container {
  width: 100%;
}

.link-editor :deep(.v-text-field) {
  flex: 1;
}

.link-editor :deep(.v-btn) {
  flex-shrink: 0;
}
</style>
