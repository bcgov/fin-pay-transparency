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

          <FinalReport />
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
import { useReportStepperStore } from '../store/modules/reportStepper';
import FinalReport from './FinalReport.vue';
import { ref } from 'vue';

const isProcessing = ref(false);
const reportStepperStore = useReportStepperStore();
</script>
