<template>
  <div class="mb-8">
    <div
      v-if="reportHtml"
      v-dompurify-html="reportHtml"
      class="report-preview"
    ></div>
    <div
      v-if="loadReportError && !reportHtml && !loading"
      class="load-report-error"
    >
      <v-alert dense variant="outlined" class="alert-error mb-3">
        Unable to load the report. This may be a temporary problem. Please
        re-try. If the problem persists, please report it to a system
        administrator
      </v-alert>
      <p class="mt-2 mb-2"></p>
      <v-btn color="secondary" @click="loadReport">Try again</v-btn>
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
import Spinner from '../Spinner.vue';

import { storeToRefs } from 'pinia';
import { useReportStepperStore } from '../../store/modules/reportStepper';
import { ref, onBeforeMount, defineEmits } from 'vue';
import ApiService from '../../common/apiService';
import { useRouter } from 'vue-router';

const { reportId } = storeToRefs(useReportStepperStore());
const reportHtml = ref();
const loading = ref<boolean>(true);
const loadReportError = ref<boolean>(false);
const router = useRouter();
const emit = defineEmits(['html-report-loaded']);

const loadReport = async () => {
  try {
    loadReportError.value = false;
    loading.value = true;
    reportHtml.value = await ApiService.getHtmlReport(reportId.value);
    emit('html-report-loaded');
  } catch (error) {
    reportHtml.value = null;
    loadReportError.value = true;
  } finally {
    loading.value = false;
  }
};

onBeforeMount(async () => {
  if (!reportId.value) {
    router.replace('/');
    return;
  }

  await loadReport();
});
</script>
