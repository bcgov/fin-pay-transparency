<template>
  <div class="d-flex flex-column flex-grow-1 ma-2 ml-0">
    <h5>
      {{ label }}
      <ToolTip
        id="date-range-tooltip"
        text="This is a date range selection. Please select the start and end date of the range. For 1 day please click the same date twice"
        width="300px"
        aria-label="date-range-tooltip"
      ></ToolTip>
    </h5>

    <VueDatePicker
      v-model="model"
      :aria-labels="{ input: label }"
      range
      placeholder="Select date range"
      :formats="{ input: 'yyyy-MM-dd', preview: 'yyyy-MM-dd' }"
      :max-date="new Date()"
      :enable-time-picker="false"
      arrow-navigation
      auto-apply
      prevent-min-max-navigation
    >
      <template #day="{ day, date }">
        <span :aria-label="formatDate(date)">
          {{ day }}
        </span>
      </template>
    </VueDatePicker>
  </div>
</template>

<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { nativeJs, DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import ToolTip from './ToolTip.vue';
import '@vuepic/vue-datepicker/dist/main.css';

const model = defineModel<Date[] | undefined>();
const { label = 'Date Range' } = defineProps<{ label?: string }>();

const formatDate = (date: Date) => {
  return LocalDate.from(nativeJs(date)).format(
    DateTimeFormatter.ofPattern('EEEE d MMMM yyyy').withLocale(Locale.CANADA),
  );
};
</script>
