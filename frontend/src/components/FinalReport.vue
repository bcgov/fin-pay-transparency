<template>
  <div class="mb-8">
    <div v-dompurify-html="finalReportHtml"></div>
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
const loading = ref<boolean>(true);
const router = useRouter();

const loadReport = async () => {
  try {
    loading.value = true;
    const unsanitisedHtml = await ApiService.getHtmlReport(reportId.value!);
    finalReportHtml.value = sanitizeUrl(unsanitisedHtml);
  } catch (error) {
    router.replace('/');
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
