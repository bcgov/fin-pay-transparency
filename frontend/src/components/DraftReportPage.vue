<template>
  <v-container class="d-flex justify-center h-100">
    <v-form ref="inputForm" class="w-100 h-100">
      <v-banner
        sticky
        width=" fit-content"
        border="none"
        bg-color="rgba(255, 255, 255, 0)"
        style="z-index: 1900"
      >
        <v-btn to="/generate-report-form">Back</v-btn>
      </v-banner>
      <v-row class="d-flex justify-center w-100">
        <v-col sm="10" md="8" class="w-100">
          <v-row class="mb-4 d-flex justify-center w-100">
            <v-col cols="10" class="w-100">
              <ReportStepper />
            </v-col>
          </v-row>

          <div class="mb-8">
            <HtmlReport @html-report-loaded="htmlReportLoaded = true" />

            <div v-if="htmlReportLoaded">
              <hr class="mt-8 mb-8" />

              <v-checkbox
                v-model="isReadyToGenerate"
                label="I am ready to create a final report that will be shared with the B.C. Government and can be shared publicly by my employer. Please note, this draft report will not be saved after closing this window or logging out of the system"
              ></v-checkbox>

              <div class="d-flex justify-center w-100 mt-4">
                <v-btn
                  id="backButton"
                  color="primary"
                  class="mr-2"
                  to="./generate-report-form"
                >
                  Back
                </v-btn>

                <v-btn
                  id="downloadDraftPdfButton"
                  color="primary"
                  class="mr-2"
                  :loading="isDownloadingPdf"
                  :disabled="isDownloadingPdf"
                  @click="downloadPdf(ReportStepperStore.reportId)"
                >
                  Download PDF
                </v-btn>

                <v-btn
                  id="generateReportButton"
                  color="primary"
                  class="mr-2"
                  :disabled="!isReadyToGenerate"
                  @click="tryGenerateReport()"
                >
                  Generate Report
                </v-btn>
              </div>
            </div>
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

    <!-- dialogs -->

    <v-dialog v-model="confirmBackDialogVisible" width="auto" max-width="400">
      <v-card>
        <v-card-text>
          Do you want to go back to the form screen? Note that this draft report
          will not be saved after navigating back or logging out of the system.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red-darken-1"
            @click="booleanDialogUtils.setDialogResponse(false)"
          >
            No
          </v-btn>
          <v-btn
            color="primary"
            @click="booleanDialogUtils.setDialogResponse(true)"
          >
            Yes
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="confirmOverrideReportDialogVisible"
      width="auto"
      max-width="400"
    >
      <v-card>
        <v-card-text>
          There is an existing report for the same time period. Do you want to
          replace it?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red-darken-1"
            @click="booleanDialogUtils.setDialogResponse(false)"
          >
            No
          </v-btn>
          <v-btn
            color="primary"
            @click="booleanDialogUtils.setDialogResponse(true)"
          >
            Yes
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import Spinner from './Spinner.vue';
import ReportStepper from './util/ReportStepper.vue';
import ApiService from '../common/apiService';
import HtmlReport from './util/HtmlReport.vue';
import { useReportStepperStore } from '../store/modules/reportStepper';
import { onBeforeMount, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { DialogUtils } from '../utils/dialogUtils';

const router = useRouter();
const isProcessing = ref<boolean>(false);
const isReadyToGenerate = ref<boolean>(false);
const confirmBackDialogVisible = ref<boolean>(false);
const confirmOverrideReportDialogVisible = ref<boolean>(false);
const htmlReportLoaded = ref<boolean>(false);
const isDownloadingPdf = ref<boolean>(false);
const ReportStepperStore = useReportStepperStore();
const booleanDialogUtils = new DialogUtils<boolean>();

let approvedRoute: string;

onBeforeMount(() => {
  ReportStepperStore.setStage('REVIEW');
  if (ReportStepperStore.reportId == null) router.push({ path: '/' });
});

onBeforeRouteLeave(async (to, from, next) => {
  if (to.fullPath == approvedRoute || ReportStepperStore.reportId == null) {
    next();
    return;
  }

  confirmBackDialogVisible.value = true;
  const response = await booleanDialogUtils.getDialogResponse();
  confirmBackDialogVisible.value = false;
  next(response);
});

function nextStage() {
  approvedRoute = '/published-report';
  router.push({ path: approvedRoute });
}

async function tryGenerateReport() {
  const existingPublished = await ApiService.getReports({
    report_start_date: ReportStepperStore.reportData.report_start_date,
    report_end_date: ReportStepperStore.reportData.report_end_date,
    report_status: 'Published',
  });

  let shouldGenerateReport = true;
  const reportAlreadyExists = existingPublished.length;
  if (reportAlreadyExists) {
    confirmOverrideReportDialogVisible.value = true;
    shouldGenerateReport = await booleanDialogUtils.getDialogResponse();
    confirmOverrideReportDialogVisible.value = false;
  }

  if (shouldGenerateReport) {
    isProcessing.value = true;
    try {
      await ApiService.publishReport(ReportStepperStore.reportId ?? '');
      nextStage();
    } catch (e) {
      console.log(e);
    }
    isProcessing.value = false;
  }
}

async function downloadPdf(reportId: string | undefined) {
  isDownloadingPdf.value = true;
  await ApiService.getPdfReport(reportId);
  isDownloadingPdf.value = false;
}
</script>
