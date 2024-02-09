<template>
  <v-col class="d-flex d-flex-col justify-center align-center">
    <div
      class="circle"
      :class="{
        active: value == stage,
        available: value != stage,
      }"
      @click="$patch({ stage: value })"
      :data-testid="'report-step-' + value"
    >
      {{ index + 1 }}
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
const { $patch } = useReportStepperStore();
defineProps(['value', 'label', 'index']);
</script>


<style scoped>
.circle {
  height: 60px;
  width: 60px;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  &.available {
    background-color: #00336633;
    cursor: pointer;
  }

  &.active {
    background-color: #003366;
    cursor: arrow;
  }

  &.disabled {
    background-color: #aaaaaa;
    cursor: not-allowed;
  }
}

.dash {
  height: 1px;
  width: 100%;
  background-color: #003366;
  padding-left: 5px;
  padding-right: 5px;

  &.disabled {
    background-color: #aaaaaa;
  }
}
</style>
