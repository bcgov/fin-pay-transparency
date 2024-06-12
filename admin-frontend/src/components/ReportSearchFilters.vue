<template>
  <div class="filters py-2">
    <v-row dense>
      <v-col sm="6" md="6" lg="4" xl="3" class="d-flex flex-column">
        <h5>Submission date</h5>
        <VueDatePicker
          v-model="submissionDateFilter"
          range
          format="yyyy-MM-dd"
          :max-date="new Date()"
          :multi-calendars="{ static: false }"
          :enable-time-picker="false"
        />
      </v-col>

      <v-col sm="6" md="6" lg="4" xl="2" class="d-flex flex-column">
        <h5>NAICS code</h5>
        <v-select
          v-model="naicsCodeFilter"
          :items="naicsCodeOptions"
          :persistent-placeholder="true"
          placeholder="All"
          multiple
          class="w-100"
          variant="solo"
          density="compact"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item
              v-bind="props"
              :title="`${item.raw.naics_code} - ${item.raw.naics_label}`"
            >
              <template v-slot:append="{ isActive }">
                <v-list-item-action start>
                  <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </template>
          <template v-slot:selection="{ item, index }">
            <v-chip v-if="index < maxSelectedNaicsCodesShown">
              <span>{{ item.raw.naics_code }}</span>
            </v-chip>
            <span
              v-if="index === maxSelectedNaicsCodesShown"
              class="text-grey text-caption align-self-center"
            >
              (+{{ naicsCodeFilter.length - maxSelectedNaicsCodesShown }} more)
            </span>
          </template>
        </v-select>
      </v-col>

      <v-col sm="4" md="2" lg="2" xl="1" class="d-flex flex-column">
        <h5>Year</h5>
        <v-select
          v-model="reportYearFilter"
          :items="reportYearOptions"
          variant="solo"
          density="compact"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw ? item.raw : 'All'">
              <template v-slot:append="{ isActive }">
                <v-icon v-if="isActive" icon="mdi-check"></v-icon>
              </template>
            </v-list-item>
          </template>
          <template v-slot:selection="{ item, index }">
            <span v-if="!item.raw">All</span>
            <span v-if="item.raw">{{ item.raw }}</span>
          </template>
        </v-select>
      </v-col>

      <v-col sm="4" md="3" lg="2" xl="1" class="d-flex flex-column">
        <h5>Locked/Unlocked</h5>
        <v-select
          v-model="lockedFilter"
          :items="[null, 'Locked', 'Unlocked']"
          variant="solo"
          density="compact"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw ? item.raw : 'All'">
              <template v-slot:append="{ isActive }">
                <v-icon v-if="isActive" icon="mdi-check"></v-icon>
              </template>
            </v-list-item>
          </template>
          <template v-slot:selection="{ item, index }">
            <span v-if="!item.raw">All</span>
            <span v-if="item.raw">{{ item.raw }}</span>
          </template>
        </v-select>
      </v-col>

      <v-col sm="8" md="7" lg="4" xl="3" class="d-flex flex-column">
        <h5>Employee count</h5>
        <v-select
          v-model="employeeCountFilter"
          :items="employeeCountOptions"
          item-title="employee_count_range"
          :persistent-placeholder="true"
          placeholder="All"
          multiple
          chips
          single-line="true"
          class="w-100"
          variant="solo"
          density="compact"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw.employee_count_range">
              <template v-slot:append="{ isActive }">
                <v-list-item-action start>
                  <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </v-col>

      <v-col
        sm="4"
        md="1"
        lg="2"
        xl="2"
        offset-sm="0"
        offset-md="11"
        offset-lg="6"
        offset-xl="0"
        class="align-stretch"
      >
        <h5>&nbsp;</h5>
        <div class="d-flex justify-end align-center filter-buttons">
          <v-btn class="btn-primary mr-0" @click="applyFilters()">
            Apply
          </v-btn>
          <v-btn class="btn-link" @click="reset()"> Clear </v-btn>
        </div>
      </v-col>
    </v-row>
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

const maxSelectedNaicsCodesShown = ref(3);
const submissionDateFilter = ref(undefined);
const naicsCodeFilter = ref(undefined);
const naicsCodeOptions = ref([
  {
    naics_code: '11',
    naics_label: 'Agriculture, forestry, fishing and hunting',
  },
  {
    naics_code: '21',
    naics_label: 'Mining, quarrying, and oil and gas extraction',
  },
  {
    naics_code: '22',
    naics_label: 'Utilities',
  },
  {
    naics_code: '23',
    naics_label: 'Construction',
  },
]);
const reportYearFilter = ref(null);
const reportYearOptions = ref([null, 2024, 2023]);
const lockedFilter = ref(null);
const employeeCountOptions = ref([
  {
    employee_count_range_id: '995f21ef-5bd2-41fc-b4c0-8bc595a3c1ab',
    employee_count_range: '50-299',
  },
  {
    employee_count_range_id: '4492feff-99d7-4b2b-8896-12a59a75d4e1',
    employee_count_range: '300-999',
  },
  {
    employee_count_range_id: '979e498c-af14-4ba4-b04e-8dd7bb44bdcc',
    employee_count_range: '1000 or more',
  },
]);
const employeeCountFilter = ref(null);

function reset() {}

function applyFilters() {}

onMounted(() => {
  //const startDate = new Date();
  //const endDate = new Date(new Date().setDate(startDate.getDate() + 7));
  //submissionDateRange.value = null;
});
</script>

<style lang="scss">
$inputHeight: 40px;
.filters {
  margin-left: -24px !important;
  margin-right: -48px !important;
  padding-left: 24px !important;
  padding-right: 24px !important;
  background-color: #eeeeee;
}
input::placeholder {
  color: black !important;
  opacity: 1 !important;
}
.v-input > .v-input__details {
  display: none !important;
}
.v-field__input {
  height: 100%;
}
.v-field__input > input {
  padding-top: 0px;
}
.filter-buttons {
  height: $inputHeight;
}

input::-ms-input-placeholder {
  color: black !important;
}
/* Override styles of the Vue3DatePicker so it looks similar to a
  Vuetify control */
input.dp__input {
  height: $inputHeight !important;
  box-shadow:
    0px 3px 1px -2px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)),
    0px 2px 2px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)),
    0px 1px 5px 0px var(--v-shadow-key-ambient-opacity, rgba(0, 0, 0, 0.12));
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
