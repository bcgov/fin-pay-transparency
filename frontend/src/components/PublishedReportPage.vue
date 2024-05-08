<template>
  <v-container class="d-flex justify-center h-100 narrow">
    <v-form ref="inputForm" class="w-100 h-100">
      <v-banner
        sticky
        width="fit-content"
        border="none"
        bg-color="rgba(255, 255, 255, 0)"
        class="sticky-top"
      >
        <v-btn class="btn-secondary" to="/">Back</v-btn>
      </v-banner>
      <v-row no-gutters justify="center" class="w-100">
        <v-col cols="12" sm="11" md="11" lg="8" xl="6">
          <v-row
            v-if="mode != ReportMode.View"
            class="mb-4 d-flex justify-center w-100"
          >
            <v-col cols="12" class="w-100">
              <ReportStepper />
            </v-col>
          </v-row>

          <HtmlReport @html-report-loaded="htmlReportLoaded = true" />
        </v-col>
      </v-row>
      <v-banner
        sticky
        width="fit-content"
        border="none"
        bg-color="rgba(255, 255, 255, 0.9)"
        class="d-flex justify-center w-100 sticky-bottom"
        v-if="htmlReportLoaded"
      >
        <v-btn
          id="downloadPdfButton"
          class="mr-2 btn-primary"
          :loading="isDownloadingPdf"
          :disabled="isDownloadingPdf"
          @click="downloadPdf(reportId)"
        >
          Download PDF
        </v-btn>
        <v-btn
          v-if="!!reportData && reportData.is_unlocked"
          id="editButton"
          class="btn-primary"
          data-testid="published-report-edit-button"
          @click="editReport()"
        >
          Edit this Report
        </v-btn>
      </v-banner>
      <v-overlay
        :persistent="true"
        :model-value="isProcessing"
        class="align-center justify-center"
      >
        <spinner />
      </v-overlay>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import Spinner from './Spinner.vue';
import ReportStepper from './util/ReportStepper/Stepper.vue';
import {
  useReportStepperStore,
  ReportMode,
} from '../store/modules/reportStepper';
import HtmlReport from './util/HtmlReport.vue';
import { onBeforeMount, ref } from 'vue';
import ApiService from '../common/apiService';
import { storeToRefs } from 'pinia';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useConfigStore } from '../store/modules/config';

const router = useRouter();
const ReportStepperStore = useReportStepperStore();

onBeforeMount(() => {
  ReportStepperStore.setStage('FINAL');
});

onBeforeRouteLeave(async (to, from, next) => {
  if (to.path !== '/generate-report-form') {
    ReportStepperStore.reset();
  }
  next();
});

const { reportId, mode, reportData } = storeToRefs(useReportStepperStore());
const { config } = storeToRefs(useConfigStore());
const isProcessing = ref(false);
const isDownloadingPdf = ref<boolean>(false);
const htmlReportLoaded = ref<boolean>(false);

const downloadPdf = async (reportId) => {
  isDownloadingPdf.value = true;
  await ApiService.getPdfReport(reportId);
  isDownloadingPdf.value = false;
};

const editReport = async () => {
  ReportStepperStore.setMode(ReportMode.Edit);
  await ReportStepperStore.setReportInfo(reportData.value);
  await router.push({ path: 'generate-report-form' });
};
</script>

<style lang="scss">
@import '../scss/_common.scss';

.narrow {
  width: 85% !important;
  padding-left: 0;
  padding-right: 0;
  @include layout-margins;
} 

.sticky-top {
  padding-left: 0;
  z-index: 190;
  bottom: none !important;
  top: 0px !important;
}

.sticky-bottom {
  z-index: 191;
  bottom: 0px !important;
  top: none !important;
}
</style>
