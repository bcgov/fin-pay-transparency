<template>
  <div class="step-root d-flex flex-column align-center">
    <div
      :data-testid="'report-step-' + value"
      :class="getThumbClassName()"
      @click="handleClick"
    ></div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useReportStepperStore } from '../../../store/modules/reportStepper';

const { stage } = storeToRefs(useReportStepperStore());

const router = useRouter();
const props = defineProps([
  'value',
  'label',
  'url',
  'index',
  'disabled',
  'completed',
]);

const getThumbClassName = () => {
  let thumbClass = 'step-thumb' + `${props.disabled ? ' disabled' : ''}`;

  if (props.completed) {
    thumbClass = `${thumbClass} completed`;
  }

  if (props.value === stage.value) {
    thumbClass = `${thumbClass} active`
  }

  return thumbClass;
};

const handleClick = () => {
  if (props.disabled) return;
  router.push(props.url);
};
</script>
<style scoped lang="scss">
.step-root {
  .step-thumb {
    width: 25px;
    height: 25px;
    background-color: #fff;
    border-radius: 15px;
    border: lightgrey 8px solid;
    cursor: pointer;

    &.disabled {
      background-color: rgb(124, 124, 123);
      cursor: not-allowed;
    }

    &.completed {
      background-color: #fff;
      border: #003366 8px solid;
    }
  }
}
</style>
