<template>
  <v-container class="d-flex justify-center h-100">
    <v-form ref="inputForm" class="w-100 h-100">
      <v-row class="d-flex justify-center w-100">
        <v-col xs="12" sm="10" md="8" class="w-100">
          <v-row class="pt-7">
            <v-col cols="12">
              <v-btn to="/">Back</v-btn>
            </v-col>
          </v-row>

          <v-row class="pt-7 mb-4 d-flex justify-center w-100">
            <v-col cols="10" class="w-100">
              <ReportStepper />
            </v-col>
          </v-row>

          <div class="mb-8">
            <FinalReport />

            <hr class="mt-8 mb-8" />

            <div>
              <v-checkbox
                v-model="isReadyToGenerate"
                label="I am ready to create a final report that will be shared with the B.C. Government and can be shared publicly by my employer. Please note, this draft report will not be saved after closing this window or logging out of the system"
              ></v-checkbox>

              <div class="d-flex justify-center w-100 mt-4">
                <v-btn id="backButton" color="primary" class="mr-2">
                  Back
                  <v-dialog
                    v-model="confirmBackDialogVisible"
                    activator="parent"
                    width="auto"
                    max-width="400"
                  >
                    <v-card>
                      <v-card-text>
                        Do you want to go back to the form screen? Note that
                        this draft report will not be saved after navigating
                        back or logging out of the system.
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                          color="red-darken-1"
                          @click="confirmBackDialogVisible = false"
                        >
                          No
                        </v-btn>
                        <v-btn
                          color="primary"
                          @click="
                            confirmBackDialogVisible = false;
                            prevStage();
                          "
                        >
                          Yes
                        </v-btn>
                        <v-spacer></v-spacer>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </v-btn>

                <v-btn
                  id="generateReportButton"
                  color="primary"
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
            @click="confirmOverrideReportDialogVisible = false"
          >
            No
          </v-btn>
          <v-btn
            color="primary"
            @click="
              confirmOverrideReportDialogVisible = false;
              generateReport();
            "
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
import FinalReport from './FinalReport.vue';
import { useReportStepperStore } from '../store/modules/reportStepper';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isProcessing = ref(false);
const isReadyToGenerate = ref(false);
const confirmBackDialogVisible = ref(false);
const confirmOverrideReportDialogVisible = ref(false);

const ReportStepperStore = useReportStepperStore();

function nextStage() {
  ReportStepperStore.setStage('FINAL');
  router.push({ path: '/published-report' });
  isReadyToGenerate.value = false;

  // Wait a short time for the stage's HTML to render
  setTimeout(() => {
    window.scrollTo(0, 0); //scroll to top of screen
  }, 100);
}

function prevStage() {
  ReportStepperStore.setStage('UPLOAD');
  router.push({ path: '/generate-report-form' });
  isReadyToGenerate.value = false;

  // Wait a short time for the stage's HTML to render
  setTimeout(() => {
    window.scrollTo(0, 0); //scroll to top of screen
  }, 100);
}

async function tryGenerateReport() {
  const existingPublished = await ApiService.getReports({
    report_start_date: ReportStepperStore.reportData.report_start_date,
    report_end_date: ReportStepperStore.reportData.report_end_date,
    report_status: 'Published',
  });
  const reportAlreadyExists = existingPublished.length;
  if (reportAlreadyExists) {
    //show a dialog to confirm override
    confirmOverrideReportDialogVisible.value = true;
  } else {
    generateReport();
  }
}

async function generateReport() {
  isProcessing.value = true;
  try {
    await ApiService.publishReport(ReportStepperStore.reportId ?? '');
    nextStage();
  } catch (e) {
    console.log(e);
  }
  isProcessing.value = false;
}
</script>
