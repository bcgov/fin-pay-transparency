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
import { ref } from 'vue';
import { NotificationService } from '../../services/notificationService';

const props = defineProps<{
  report: Report;
}>();
const emits = defineEmits(['onLockStatusChanged']);

const isLoadingPdf = ref<boolean>(false);

const confirmDialog = ref<typeof ConfirmationDialog>();

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
    console.log(e);
    NotificationService.pushNotificationError(
      'Something went wrong.  Unable to download report.',
    );
  }
  isLoadingPdf.value = false;
}
</script>
