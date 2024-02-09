<template>
  <v-col class="d-flex-col justify-center align-center">
    <div
      class="circle"
      :class="{
        active: value == stage,
        available: value != stage,
      }"
    >
      {{ index }}
    </div>
  </v-col>
  <v-col v-if="index !== 2" class="d-flex justify-center align-center">
    <div class="dash disabled"></div>
  </v-col>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useReportStepperStore } from '../../store/modules/reportStepper';
const { stage } = storeToRefs(useReportStepperStore());
defineProps(['value', 'label', 'index']);
</script>
