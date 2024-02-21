<template>
  <v-container class="d-flex justify-center h-100">
    <v-form ref="inputForm" class="w-100 h-100">
      <v-row class="d-flex justify-center w-100">
        <v-col xs="12" sm="10" md="8" class="w-100">
          <v-row v-if="mode != ReportMode.View" class="pt-7">
            <v-col cols="12">
              <v-btn to="/">Back</v-btn>
            </v-col>
          </v-row>

          <v-row
            v-if="mode != ReportMode.View"
            class="pt-7 mb-4 d-flex justify-center w-100"
          >
            <v-col cols="10" class="w-100">
              <ReportStepper />
            </v-col>
          </v-row>

          <HtmlReport @html-report-loaded="htmlReportLoaded = true" />

          <div v-if="htmlReportLoaded" class="d-flex justify-center w-100 mt-4">
            <v-btn
              id="downloadDraftPdfButton"
              color="primary"
              class="mr-2"
              :loading="isDownloadingPdf"
              :disabled="isDownloadingPdf"
              @click="downloadPdf(reportId)"
            >
              Download PDF
            </v-btn>
          </div>
        </v-col>
      </v-row>
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
import '@vuepic/vue-datepicker/dist/main.css';
import Spinner from './Spinner.vue';
import ReportStepper from './util/ReportStepper.vue';
import {
  useReportStepperStore,
  ReportMode,
} from '../store/modules/reportStepper';
import HtmlReport from './util/HtmlReport.vue';
import { ref } from 'vue';
import ApiService from '../common/apiService';
import { storeToRefs } from 'pinia';

const { reportId, mode } = storeToRefs(useReportStepperStore());
const isProcessing = ref(false);
const isDownloadingPdf = ref<boolean>(false);
const htmlReportLoaded = ref<boolean>(false);

const downloadPdf = async (reportId) => {
  isDownloadingPdf.value = true;
  await ApiService.getPdfReport(reportId);
  isDownloadingPdf.value = false;
};
</script>
