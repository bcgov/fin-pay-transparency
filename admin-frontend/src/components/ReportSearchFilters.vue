<template>
  <div class="primary-filters">
    <v-row dense class="mt-0 w-100 mb-4">
      <v-col sm="9" md="8" lg="6" xl="4" class="d-flex align-center">
        <v-text-field
          v-model="searchText"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          label="Search by employer name"
          variant="solo"
          hide-details
          :single-line="true"
          @keyup.enter="searchReports()"
        >
          <template #append> </template>
        </v-text-field>
        <v-btn class="btn-primary" @click="searchReports()"> Search </v-btn>
      </v-col>
      <v-col
        sm="3"
        md="4"
        lg="6"
        xl="8"
        class="d-flex justify-end align-center"
      >
        <v-btn
          class="btn-secondary me-2"
          :disabled="!isDirty()"
          @click="reset()"
        >
          Reset
        </v-btn>
        <v-btn
          class="btn-secondary"
          prepend-icon="mdi-filter"
          :append-icon="
            areSecondaryFiltersVisible ? 'mdi-arrow-up' : 'mdi-arrow-down'
          "
          @click="toggleSecondaryFiltersVisible()"
        >
          Filter
        </v-btn>
      </v-col>
    </v-row>
  </div>

  <div v-if="areSecondaryFiltersVisible" class="secondary-filters py-4">
    <v-row dense>
      <v-col sm="6" md="6" lg="4" xl="3" class="d-flex flex-column">
        <h5>
          Submission Date Range
          <ToolTip
            id="submission-date-range-tooltip"
            text="This is a date range selection. Please select the start and end date of the range. For 1 day please click the same date twice"
            width="300px"
            aria-label="submission-date-range-tooltip"
          ></ToolTip>
        </h5>

        <VueDatePicker
          v-model="submissionDateRange"
          range
          placeholder="Select date range"
          format="yyyy-MM-dd"
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
      </v-col>

      <v-col sm="6" md="6" lg="4" xl="2" class="d-flex flex-column">
        <h5>NAICS Code</h5>
        <v-select
          v-model="selectedNaicsCodes"
          :items="naicsCodes"
          :persistent-placeholder="true"
          placeholder="All"
          multiple
          class="w-100"
          variant="solo"
          density="compact"
        >
          <template #item="{ props, item }">
            <v-list-item
              v-bind="props"
              :title="`${item.raw.naics_code} - ${item.raw.naics_label}`"
            >
              <template #append="{ isActive }">
                <v-list-item-action start>
                  <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </template>
          <template #selection="{ item, index }">
            <v-chip v-if="index < maxSelectedNaicsCodesShown">
              <span>{{ item.raw.naics_code }}</span>
            </v-chip>
            <span
              v-if="index === maxSelectedNaicsCodesShown"
              class="text-grey text-caption align-self-center"
            >
              (+{{ selectedNaicsCodes.length - maxSelectedNaicsCodesShown }}
              more)
            </span>
          </template>
        </v-select>
      </v-col>

      <v-col sm="4" md="2" lg="2" xl="1" class="d-flex flex-column">
        <h5>Year</h5>
        <v-select
          id="report-year"
          v-model="selectedReportYear"
          :items="reportYearOptions"
          variant="solo"
          density="compact"
          aria-label="Report Year"
        >
          <template #item="{ props, item }">
            <v-list-item
              :aria-label="'Year: ' + item.raw"
              v-bind="props"
              :title="item.raw ? item.raw : 'All'"
            >
              <template #append="{ isActive }">
                <v-icon v-if="isActive" icon="mdi-check"></v-icon>
              </template>
            </v-list-item>
          </template>
          <template #selection="{ item, index }">
            <span v-if="!item.raw">All</span>
            <span v-if="item.raw">{{ item.raw }}</span>
          </template>
        </v-select>
      </v-col>

      <v-col sm="4" md="3" lg="2" xl="1" class="d-flex flex-column">
        <h5>Locked/Unlocked</h5>
        <v-select
          id="unlocked-status"
          v-model="selectedLockedValues"
          :items="lockedOptions"
          variant="solo"
          density="compact"
          aria-label="Locked/Unlocked"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw ? item.raw : 'All'">
              <template #append="{ isActive }">
                <v-icon v-if="isActive" icon="mdi-check"></v-icon>
              </template>
            </v-list-item>
          </template>
          <template #selection="{ item, index }">
            <span v-if="!item.raw">All</span>
            <span v-if="item.raw">{{ item.raw }}</span>
          </template>
        </v-select>
      </v-col>

      <v-col sm="8" md="7" lg="4" xl="3" class="d-flex flex-column">
        <h5>Employee Count</h5>
        <v-select
          v-model="selectedEmployeeCount"
          :items="employeeCountRanges"
          :persistent-placeholder="true"
          placeholder="All"
          multiple
          class="w-100"
          variant="solo"
          density="compact"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw.employee_count_range">
              <template #append="{ isActive }">
                <v-list-item-action start>
                  <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </template>
          <template #selection="{ item, index }">
            <v-chip>
              <span>{{ item.raw.employee_count_range }}</span>
            </v-chip>
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
          <v-btn class="btn-primary mr-0" @click="searchReports()">
            Apply
          </v-btn>
          <v-btn
            class="btn-link ms-2"
            :disabled="!areSecondaryFiltersDirty()"
            @click="clear()"
          >
            Clear
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ReportSearchFilters',
};
</script>

<script setup lang="ts">
import { range } from 'lodash';
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import { useCodeStore } from '../store/modules/codeStore';
import { useReportSearchStore } from '../store/modules/reportSearchStore';
import '@vuepic/vue-datepicker/dist/main.css';
import { ReportFilterType } from '../types/reports';
import {
  ZonedDateTime,
  nativeJs,
  DateTimeFormatter,
  LocalDate,
} from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import ToolTip from './ToolTip.vue';

const reportSearchStore = useReportSearchStore();
const codeStore = useCodeStore();

const searchText = ref<string | undefined>(undefined);
const submissionDateRange = ref<any[] | undefined>(undefined);
const areSecondaryFiltersVisible = ref<boolean>(false);
const maxSelectedNaicsCodesShown = ref(3);
const selectedNaicsCodes = ref([]);
const selectedReportYear = ref(undefined);
const selectedLockedValues = ref(undefined);
const selectedEmployeeCount = ref([]);

const { employeeCountRanges, naicsCodes } = storeToRefs(codeStore);
const startYear = 2024;
const currentYear = new Date().getFullYear();
const reportYearOptions = ref([
  null,
  ...range(startYear, currentYear + 1).reverse(),
]);
const lockedOptions = ref([null, 'Locked', 'Unlocked']);

const formatDate = (date: Date) => {
  return LocalDate.from(nativeJs(date)).format(
    DateTimeFormatter.ofPattern('EEEE d MMMM yyyy').withLocale(Locale.CANADA),
  );
};

function getReportSearchFilters(): ReportFilterType {
  const filters: any[] = [];
  if (searchText.value) {
    filters.push({
      key: 'company_name',
      operation: 'like',
      value: searchText.value,
    });
  }
  if (submissionDateRange.value) {
    filters.push({
      key: 'create_date',
      operation: 'between',
      value: submissionDateRange.value.map((d, i) => {
        const jodaZonedDateTime = ZonedDateTime.from(nativeJs(d));
        const adjusted =
          i == 0
            ? jodaZonedDateTime //start of day
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0)
            : jodaZonedDateTime //end of day
                .withHour(23)
                .withMinute(59)
                .withSecond(59)
                .withNano(999);

        return DateTimeFormatter.ISO_DATE_TIME.format(adjusted);
      }),
    });
  }
  if (selectedNaicsCodes.value?.length) {
    filters.push({
      key: 'naics_code',
      operation: 'in',
      value: selectedNaicsCodes.value?.map((d: any) => d.naics_code),
    });
  }
  if (selectedReportYear.value) {
    filters.push({
      key: 'reporting_year',
      operation: 'eq',
      value: selectedReportYear.value,
    });
  }
  if (selectedEmployeeCount.value?.length) {
    filters.push({
      key: 'employee_count_range_id',
      operation: 'in',
      value: selectedEmployeeCount.value?.map(
        (d: any) => d.employee_count_range_id,
      ),
    });
  }
  if (selectedLockedValues.value) {
    filters.push({
      key: 'is_unlocked',
      operation: 'eq',
      value: selectedLockedValues.value == 'Unlocked',
    });
  }
  return filters;
}

async function searchReports() {
  const params = {
    filter: getReportSearchFilters(),
  };
  reportSearchStore.searchReports(params);
}

function toggleSecondaryFiltersVisible() {
  areSecondaryFiltersVisible.value = !areSecondaryFiltersVisible.value;
}

/*
Determines whether any of the original state has been changed.
*/
function isDirty() {
  return (
    (searchText.value != undefined && searchText.value.trim() != '') ||
    areSecondaryFiltersVisible.value ||
    areSecondaryFiltersDirty()
  );
}

/*
Determines whether the original state of the secondary filters area
has been changed
*/
function areSecondaryFiltersDirty() {
  return (
    submissionDateRange.value != undefined ||
    selectedNaicsCodes.value?.length != 0 ||
    selectedReportYear.value != undefined ||
    selectedLockedValues.value != undefined ||
    selectedEmployeeCount.value?.length !== 0
  );
}

function clear() {
  searchText.value = undefined;
  submissionDateRange.value = undefined;
  selectedNaicsCodes.value = [];
  selectedReportYear.value = undefined;
  selectedLockedValues.value = undefined;
  selectedEmployeeCount.value = [];
  reportSearchStore.reset();
}

function reset() {
  clear();
  areSecondaryFiltersVisible.value = false;
}

onMounted(() => {});
</script>

<style scoped lang="scss">
$inputHeight: 40px;
.primary-filters {
  margin-right: -24px;
}
.secondary-filters {
  margin-left: -24px !important;
  margin-right: -48px !important;
  padding-left: 24px !important;
  padding-right: 32px !important;
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
