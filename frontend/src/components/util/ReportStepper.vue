<template>
  <v-row>
    <ReportStep
      v-for="(item, index) in REPORT_STAGES"
      :value="item.value"
      :label="item.label"
      :index="index"
    />
  </v-row>
  <v-row>
    <v-col class="d-flex d-flex-col justify-center align-center">
      <h5>Upload</h5>
    </v-col>
    <v-col class="d-flex justify-center align-center"> </v-col>
    <v-col class="d-flex justify-center align-center">
      <h5>Review</h5>
    </v-col>
    <v-col class="d-flex justify-center align-center"> </v-col>
    <v-col class="d-flex justify-center align-center">
      <h5>Report</h5>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import ReportStep from './ReportStep.vue';
import {
  REPORT_STAGES,
} from '../../store/modules/reportStepper';
</script>

