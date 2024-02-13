<template>
  <div class="mb-8">
    <div v-html="finalReportHtml"></div>
  </div>
  <v-overlay
    :persistent="true"
    :model-value="loading"
    class="align-center justify-center"
  >
    <spinner />
  </v-overlay>
</template>

<script lang="ts">
import Spinner from './Spinner.vue';

import { storeToRefs } from 'pinia';
import { useReportStepperStore } from '../store/modules/reportStepper';
import ApiService from '../common/apiService';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { useRouter } from 'vue-router';

export default {
  components: {
    Spinner,
  },
  data: () => ({
    reportId: storeToRefs(useReportStepperStore()).reportId,
    finalReportHtml: null,
    loading: true,
    router: useRouter(),
  }),

  async beforeMount() {
    if (!this.reportId) {
      this.router.replace('/');
      return;
    }

    try {
      this.loading = true;
      const unsanitisedHtml = await ApiService.getHtmlReport(this.reportId!);
      this.finalReportHtml = sanitizeUrl(unsanitisedHtml);
    } catch (error) {
      this.router.replace('/');
    } finally {
      this.loading = false;
    }
  },
};
</script>
