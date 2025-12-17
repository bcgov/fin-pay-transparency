<template v-if="props.report">
  <v-tooltip text="Open Report" location="bottom">
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        aria-label="Open Report"
        density="compact"
        variant="plain"
        icon="mdi-file-pdf-box"
        :loading="isLoadingPdf"
        :disabled="isLoadingPdf"
        @click="viewReportInNewTab(props.report.report_id)"
      ></v-btn>
    </template>
  </v-tooltip>

  <v-tooltip
    :text="props.report.is_unlocked ? 'Lock report' : 'Unlock report'"
    location="bottom"
  >
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        :aria-label="props.report.is_unlocked ? 'Lock report' : 'Unlock report'"
        density="compact"
        variant="plain"
        :icon="props.report.is_unlocked ? 'mdi-lock-open' : 'mdi-lock'"
        :color="props.report.is_unlocked ? 'success' : 'error'"
        @click="
          lockUnlockReport(props.report.report_id, !props.report.is_unlocked)
        "
      ></v-btn>
    </template>
  </v-tooltip>

  <v-tooltip
    v-if="canChasngeReportingYear"
    text="Edit reporting year"
    location="bottom"
  >
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        aria-label="Edit reporting year"
        density="compact"
        variant="plain"
        icon="mdi-pencil"
        @click="changeReportingYear(props.report.report_id)"
      ></v-btn>
    </template>
  </v-tooltip>

  <v-tooltip v-if="canWithdrawReport" text="Withdraw report" location="bottom">
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        aria-label="Withdraw report"
        density="compact"
        variant="plain"
        icon="mdi-delete"
        color="error"
        @click="withdrawReport(props.report.report_id)"
      ></v-btn>
    </template>
  </v-tooltip>

  <v-tooltip text="Admin action history" location="bottom">
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        aria-label="Admin action history"
        density="compact"
        variant="plain"
        icon="mdi-clock-time-four"
        :loading="isLoadingAdminActionHistory"
        @click="openAdminActionHistory(props.report.report_id)"
      >
        <v-icon size="large"></v-icon>
        <v-menu activator="parent">
          <v-card class="">
            <v-card-text>
              <div class="history-panel h-100">
                <ReportAdminActionHistoryView
                  v-if="
                    !isLoadingAdminActionHistory && reportAdminActionHistory
                  "
                  :report-admin-action-history="reportAdminActionHistory"
                ></ReportAdminActionHistoryView>
              </div>
              <v-skeleton-loader
                v-if="isLoadingAdminActionHistory"
                type="paragraph"
                class="mt-0"
              ></v-skeleton-loader>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-btn>
    </template>
  </v-tooltip>

  <!-- dialogs -->
  <ConfirmationDialog ref="confirmDialog"> </ConfirmationDialog>
  <ConfirmationDialog ref="confirmWithdrawDialog">
    <template #message>
      <p class="mb-2">
        Are you sure this is the correct report the employer has requested to
        remove?
      </p>
      <p>
        If confirmed, the report will be hidden from the employer's view in the
        Reporting Tool, and from the Analytics section in the Admin Portal.
      </p>
    </template>
  </ConfirmationDialog>
  <ConfirmationDialog ref="changeYearDialog">
    <template #message>
      <p class="mb-2">
        for
        <strong>{{
          props.report?.pay_transparency_company?.company_name
        }}</strong
        >.
      </p>
      <p class="my-3">
        Current reporting year:
        <strong>{{ props.report?.reporting_year }}</strong>
      </p>
      <v-select
        v-model="selectedReportingYear"
        :items="availableReportingYears"
        label="Select new reporting year"
        variant="outlined"
        density="compact"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item
            v-bind="itemProps"
            :disabled="item.raw.disabled"
            :subtitle="item.raw.subtitle"
          ></v-list-item>
        </template>
      </v-select>
    </template>
  </ConfirmationDialog>
</template>

<script lang="ts">
export default {
  name: 'ReportActions',
};
</script>
<script setup lang="ts">
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import ApiService from '../../services/apiService';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { NotificationService } from '../../services/notificationService';
import ReportAdminActionHistoryView from './ReportAdminActionHistoryPanel.vue';
import { Report, ReportAdminActionHistory } from '../../types/reports';
import {
  ReportChangeService,
  ReportChangedEventPayload,
} from '../../services/reportChangeService';
import { authStore } from '../../store/modules/auth';

const props = defineProps<{
  report: Report;
}>();

const confirmDialog = ref<typeof ConfirmationDialog>();

const auth = authStore();

onMounted(() => {
  ReportChangeService.listen(onAnyReportChanged);
});

onUnmounted(() => {
  ReportChangeService.unlisten(onAnyReportChanged);
});

function onAnyReportChanged(payload: ReportChangedEventPayload) {
  if (payload.reportId == props.report?.report_id) {
    console.log(`reportActions (${payload.reportId}) - onAnyReportChanged`);
    reset();
  }
}

function reset() {
  reportAdminActionHistory.value = undefined;
  hadErrorLoadingAdminActionHistory.value = false;
}

// #region Lock / Unlock Report

async function lockUnlockReport(reportId: string, makeUnlocked: boolean) {
  const lockText = makeUnlocked ? 'unlock' : 'lock';
  const isConfirmed = await confirmDialog.value?.open(
    `${lockText} report`,
    `Are you sure you want to ${lockText} the report?`,
    {
      titleBold: true,
      resolveText: `Yes, ${lockText}`,
    },
  );
  if (isConfirmed) {
    await ApiService.lockUnlockReport(reportId, makeUnlocked);

    //report_unlock_date and admin_last_access_date will have changed
    ReportChangeService.reportChanged(reportId);
  }
}

// #endregion
// #region View Report PDF

const isLoadingPdf = ref<boolean>(false);

// Downloads a PDF report with the given reportId, and opens it in a new tab
// (or a new window, depending on how the browser is configured).
async function viewReportInNewTab(reportId: string) {
  isLoadingPdf.value = true;
  try {
    const pdfAsBlob = await ApiService.getPdfReportAsBlob(reportId);

    //admin_last_access_date will have changed
    ReportChangeService.reportChanged(reportId);
    const objectUrl = URL.createObjectURL(pdfAsBlob);
    window.open(objectUrl);
  } catch (e) {
    NotificationService.pushNotificationError(
      'Something went wrong.  Unable to download report.',
    );
  }
  isLoadingPdf.value = false;
}

// #endregion
// #region Admin Action History

const isLoadingAdminActionHistory = ref<boolean>(false);
const hadErrorLoadingAdminActionHistory = ref<boolean>(false);
const reportAdminActionHistory = ref<ReportAdminActionHistory[] | undefined>(
  undefined,
);

async function openAdminActionHistory(reportId: string) {
  //fetch the "admin action history" from the backend, then cache it
  //so we don't need to look it up again
  if (!isLoadingAdminActionHistory.value && !reportAdminActionHistory.value) {
    await fetchAdminActionHistory(reportId);
  }
}

async function fetchAdminActionHistory(reportId: string) {
  console.log('fetchingAdminActionHistory');
  isLoadingAdminActionHistory.value = true;
  hadErrorLoadingAdminActionHistory.value = false;
  try {
    reportAdminActionHistory.value =
      await ApiService.getReportAdminActionHistory(reportId);
  } catch (e) {
    hadErrorLoadingAdminActionHistory.value = true;
  } finally {
    isLoadingAdminActionHistory.value = false;
  }
}

// #endregion
// #region Change Reporting Year

const changeYearDialog = ref<typeof ConfirmationDialog>();
const selectedReportingYear = ref<number | null>(null);

const canChasngeReportingYear = computed(() => {
  return (
    props.report?.report_status === 'Published' &&
    auth.doesUserHaveRole('PTRT-ADMIN')
  );
});

const availableReportingYears = computed(() => {
  const currentYear = new Date().getFullYear();
  const currentYearStr = currentYear.toString();
  const previousYearStr = (currentYear - 1).toString();
  return [
    {
      title: currentYearStr,
      value: currentYear,
      disabled: currentYearStr == props.report?.reporting_year,
      subtitle:
        currentYearStr == props.report?.reporting_year
          ? ' (Current reporting year)'
          : '',
    },
    {
      title: previousYearStr,
      value: currentYear - 1,
      disabled: previousYearStr == props.report?.reporting_year,
      subtitle:
        previousYearStr == props.report?.reporting_year
          ? ' (Current reporting year)'
          : '',
    },
  ];
});

async function changeReportingYear(reportId: string) {
  // Open year selection dialog
  const yearSelected = await changeYearDialog.value?.open(
    'Change reporting year',
    null,
    {
      titleBold: true,
      resolveText: 'Next',
      rejectText: 'Cancel',
    },
  );

  if (!yearSelected) return;

  if (!selectedReportingYear.value) {
    NotificationService.pushNotificationError('No year selected.');
    return;
  }

  // Open confirmation dialog
  const confirmed = await confirmDialog.value?.open(
    'Confirm reporting year change',
    `Are you sure you want to change the reporting year for ${props.report?.pay_transparency_company?.company_name} from ${props.report?.reporting_year} to ${selectedReportingYear.value}?`,
    {
      titleBold: true,
      resolveText: 'Yes, change year',
      rejectText: 'Cancel',
    },
  );

  if (!confirmed) return;

  // Update reporting year
  try {
    await ApiService.updateReportReportingYear(
      reportId,
      selectedReportingYear.value,
    );
    NotificationService.pushNotificationSuccess(
      'Reporting year has been updated successfully.',
    );
    ReportChangeService.reportChanged(reportId);
  } catch (error) {
    console.error('Error updating reporting year:', error);
    NotificationService.pushNotificationError(
      'Failed to update reporting year. Please try again.',
    );
  }
}

// #endregion
// #region Withdraw Report

const confirmWithdrawDialog = ref<typeof ConfirmationDialog>();

const canWithdrawReport = computed(() => {
  return (
    props.report?.report_status === 'Published' &&
    auth.doesUserHaveRole('PTRT-ADMIN')
  );
});

async function withdrawReport(reportId: string) {
  const isConfirmed = await confirmWithdrawDialog.value?.open(
    'Withdraw report',
    null,
    {
      titleBold: true,
      resolveText: 'Yes, withdraw',
      rejectText: 'Cancel',
    },
  );

  if (isConfirmed) {
    try {
      await ApiService.withdrawReport(reportId);

      NotificationService.pushNotificationSuccess(
        'Report has been withdrawn successfully.',
      );

      // Notify that the report has changed
      ReportChangeService.reportChanged(reportId);
    } catch (error) {
      console.error('Error withdrawing report:', error);
      NotificationService.pushNotificationError(
        'Failed to withdraw report. Please try again.',
      );
    }
  }
}

// #endregion
</script>

<style>
.history-panel {
  min-width: 280px;
  max-height: 210px;
  overflow-y: auto;
}
</style>
