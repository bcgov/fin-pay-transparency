<template>
  <div class="mb-8">
    <div v-dompurify-html="reportHtml"></div>
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
const router = useRouter();
const emit = defineEmits(['html-report-loaded']);

const loadReport = async () => {
  try {
    loading.value = true;
    reportHtml.value = await ApiService.getHtmlReport(reportId.value);
    emit('html-report-loaded');
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
