<template>
  <div class="primary-filters d-flex flex-wrap mb-2">
    <div
      class="d-flex flex-grow-1 my-2 mr-4 ml-0"
      style="width: 400px; max-width: 650px"
    >
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
    </div>

    <div class="d-flex ml-auto my-2 mr-2 mr-4">
      <v-btn class="btn-secondary me-2" :disabled="!isDirty()" @click="reset()">
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
    </div>
  </div>

  <div
    v-if="areSecondaryFiltersVisible"
    class="secondary-filters py-2 d-flex flex-wrap"
  >
    <DateRangeFilter
      v-model="submissionDateRange"
      label="Submission Date Range"
    />

    <div class="d-flex flex-column flex-grow-1 ma-2 ml-0" style="width: 307px">
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
    </div>

    <div class="d-flex flex-column flex-grow-1 ma-2 ml-0" style="width: 102px">
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
    </div>

    <div class="d-flex flex-column flex-grow-1 ma-2 ml-0" style="width: 136px">
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
    </div>

    <div
      class="d-flex flex-column flex-grow-1 ma-2 ml-0"
      style="width: 320px; max-width: 400px"
    >
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
    </div>

    <div
      class="d-flex flex-column flex-grow-1 me-auto ma-2 ml-0"
      style="width: 148px; max-width: 300px"
    >
      <h5>Status</h5>
      <v-select
        id="status-filter"
        v-model="selectedStatusValues"
        :items="statusOptions"
        variant="solo"
        density="compact"
        aria-label="Status"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :title="item.raw ? item.raw : 'All'">
            <template #append="{ isActive }">
              <v-icon v-if="isActive" icon="mdi-check"></v-icon>
            </template>
          </v-list-item>
        </template>
        <template #selection="{ item }">
          <span v-if="!item.raw">All</span>
          <span v-if="item.raw">{{ item.raw }}</span>
        </template>
      </v-select>
    </div>

    <div class="d-flex flex-column ma-2 mr-0">
      <h5>&nbsp;</h5>
    </div>

    <div class="d-flex flex-column ml-auto ma-2 mr-0">
      <h5>&nbsp;</h5>
      <div class="d-flex justify-end align-center filter-buttons">
        <v-btn class="btn-primary mr-0" @click="searchReports()"> Apply </v-btn>
        <v-btn
          class="btn-link ms-2"
          :disabled="!areSecondaryFiltersDirty()"
          @click="clear()"
        >
          Clear
        </v-btn>
      </div>
    </div>
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
import { useCodeStore } from '../store/modules/codeStore';
import { useReportSearchStore } from '../store/modules/reportSearchStore';
import { ReportFilterType } from '../types/reports';
import { ZonedDateTime, nativeJs, DateTimeFormatter } from '@js-joda/core';
import DateRangeFilter from './DateRangeFilter.vue';

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
const selectedStatusValues = ref('Published');

const { employeeCountRanges, naicsCodes } = storeToRefs(codeStore);
const startYear = 2024;
const currentYear = new Date().getFullYear();
const reportYearOptions = ref([
  null,
  ...range(startYear, currentYear + 1).reverse(),
]);
const lockedOptions = ref([null, 'Locked', 'Unlocked']);
const statusOptions = ref([null, 'Published', 'Withdrawn']);

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
  if (selectedStatusValues.value && selectedStatusValues.value !== 'All') {
    filters.push({
      key: 'report_status',
      operation: 'eq',
      value: selectedStatusValues.value,
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
    selectedEmployeeCount.value?.length !== 0 ||
    (selectedStatusValues.value != undefined &&
      selectedStatusValues.value !== 'Published')
  );
}

function clear() {
  searchText.value = undefined;
  submissionDateRange.value = undefined;
  selectedNaicsCodes.value = [];
  selectedReportYear.value = undefined;
  selectedLockedValues.value = undefined;
  selectedEmployeeCount.value = [];
  selectedStatusValues.value = 'Published';
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
</style>
