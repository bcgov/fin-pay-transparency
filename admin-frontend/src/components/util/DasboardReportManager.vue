<template><div></div></template>

<script async setup lang="ts">
import { useRouter } from 'vue-router';
import { useReportStepperStore } from '../../store/modules/reportStepper';
import { storeToRefs } from 'pinia';
import { watchEffect } from 'vue';

const { reportId } = storeToRefs(useReportStepperStore());
const router = useRouter();

watchEffect(
  () => {
    if (reportId.value) {
      router.push({path: '/published-report'});
    }
  });
</script>
