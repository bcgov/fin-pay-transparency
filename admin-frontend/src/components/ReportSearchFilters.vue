<template>
  <div class="filters px-8 py-8 d-flex">
    <div class="d-flex flex-column">
      <h5>Submission date</h5>
      <VueDatePicker
        v-model="submissionDateRange"
        range
        format="yyyy-MM-dd"
        :max-date="new Date()"
        :multi-calendars="{ static: false }"
        :enable-time-picker="false"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReportSearchFilters',
};
</script>

<script setup>
import { ref, onMounted } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const submissionDateRange = ref(undefined);

onMounted(() => {
  const startDate = new Date();
  const endDate = new Date(new Date().setDate(startDate.getDate() + 7));
  //submissionDateRange.value = null;
});
</script>

<style lang="scss">
.filters {
  background-color: #eeeeee;
}
button.dp__action_button {
  padding: 16px 16px 16px 16px !important;
  min-width: 64px;
  font-weight: 500;
  font-family: 'BCSans', 'Noto Sans', Verdana, Arial, sans-serif !important;
  font-size: 14px;
  letter-spacing: 1.25px;
}
button.dp__action_button.dp__action_select {
  background-color: #003366;
}
.dp__today {
  border: 1px solid #003366;
}
</style>
