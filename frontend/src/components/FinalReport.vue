<template>
  <div class="mb-8">
    <div v-dompurify-html="finalReportHtml"></div>

    <div class="d-flex justify-center w-100 mt-4" v-if="finalReportHtml">
      <v-btn
        id="downloadDraftPdfButton"
        text="Download PDF"
        color="primary"
        class="mr-2"
        :loading="isDownloadingPdf"
        :disabled="isDownloadingPdf"
        @click="downloadPdf(reportId)"
      >
        Download PDF
      </v-btn>
    </div>
  </div>
  <v-overlay
    :persistent="true"
    :model-value="loading"
    class="align-center justify-center"
  >
    <spinner />
  </v-overlay>
</template>

<script setup lang="ts">
import Spinner from './Spinner.vue';

import { storeToRefs } from 'pinia';
import { useReportStepperStore } from '../store/modules/reportStepper';
import { ref, onBeforeMount } from 'vue';
import ApiService from '../common/apiService';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { useRouter } from 'vue-router';

const { reportId } = storeToRefs(useReportStepperStore());
const finalReportHtml = ref();
const isDownloadingPdf = ref<boolean>(false);
const loading = ref<boolean>(true);
const router = useRouter();

const loadReport = async () => {
  try {
    loading.value = true;
    const unsanitisedHtml = await ApiService.getHtmlReport(reportId.value);
    finalReportHtml.value = sanitizeUrl(unsanitisedHtml);
  } catch (error) {
    router.replace('/');
  } finally {
    loading.value = false;
  }
};

const downloadPdf = async (reportId) => {
  isDownloadingPdf.value = true;
  await ApiService.getPdfReport(reportId);
  isDownloadingPdf.value = false;
};

onBeforeMount(async () => {
  if (!reportId.value) {
    router.replace('/');
    return;
  }

  await loadReport();
});
</script>
