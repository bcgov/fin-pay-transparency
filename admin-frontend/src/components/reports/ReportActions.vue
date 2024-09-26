<template v-if="props.report">
  <v-btn
    aria-label="Open Report"
    density="compact"
    variant="plain"
    icon="mdi-file-pdf-box"
    :loading="isLoadingPdf"
    :disabled="isLoadingPdf"
    @click="viewReportInNewTab(props.report.report_id)"
  ></v-btn>
  <v-btn
    :aria-label="props.report.is_unlocked ? 'Lock report' : 'Unlock report'"
    density="compact"
    variant="plain"
    :icon="props.report.is_unlocked ? 'mdi-lock-open' : 'mdi-lock'"
    :color="props.report.is_unlocked ? 'success' : 'error'"
    @click="lockUnlockReport(props.report.report_id, !props.report.is_unlocked)"
  ></v-btn>

  <v-btn
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
          <div class="history-panel">
            <ReportAdminActionHistoryView
              v-if="!isLoadingAdminActionHistory && reportAdminActionHistory"
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

  <!-- dialogs -->
  <ConfirmationDialog ref="confirmDialog"> </ConfirmationDialog>
</template>

<script lang="ts">
export default {
  name: 'ReportActions',
};
</script>
<script setup lang="ts">
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import ApiService from '../../services/apiService';
import { Report } from '../../types/reports';
import { ref, onMounted } from 'vue';
import { NotificationService } from '../../services/notificationService';
import ReportAdminActionHistoryView from './ReportAdminActionHistoryPanel.vue';
import { ReportAdminActionHistory } from '../../types/reports';

const props = defineProps<{
  report: Report;
}>();
const emits = defineEmits(['onLockStatusChanged']);

const isLoadingPdf = ref<boolean>(false);
const isLoadingAdminActionHistory = ref<boolean>(false);
const hadErrorLoadingAdminActionHistory = ref<boolean>(false);
const reportAdminActionHistory = ref<ReportAdminActionHistory | undefined>(
  undefined,
);
const confirmDialog = ref<typeof ConfirmationDialog>();

onMounted(() => {
  reset();
});

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
    emits('onLockStatusChanged');
  }
}

/*
Downloads a PDF report with the given reportId, and opens it in a new tab
(or a new window, depending on how the browser is configured).
*/
async function viewReportInNewTab(reportId: string) {
  isLoadingPdf.value = true;
  try {
    const pdfAsBlob = await ApiService.getPdfReportAsBlob(reportId);
    const objectUrl = URL.createObjectURL(pdfAsBlob);
    window.open(objectUrl);
  } catch (e) {
    NotificationService.pushNotificationError(
      'Something went wrong.  Unable to download report.',
    );
  }
  isLoadingPdf.value = false;
}

async function openAdminActionHistory(reportId: string) {
  //fetch the "admin action history" from the backend, then cache it
  //so we don't need to look it up again
  if (!isLoadingAdminActionHistory.value && !reportAdminActionHistory.value) {
    await fetchAdminActionHistory(reportId);
  }
}

async function fetchAdminActionHistory(reportId: string) {
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

function reset() {
  reportAdminActionHistory.value = undefined;
  hadErrorLoadingAdminActionHistory.value = false;
}
</script>

<style>
.history-panel {
  min-width: 280px;
  min-height: 50px;
  max-height: 210px;
  overflow-y: auto;
}
</style>
