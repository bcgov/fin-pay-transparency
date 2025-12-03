<template>
  <v-row dense class="mt-0 w-100 mb-4 align-end">
    <div
      class="d-flex flex-column flex-grow-1 flex-shrink-1 ma-2 ml-0 flex-basis-200"
    >
      <h3 class="mb-2">Search Employer</h3>
      <v-text-field
        v-model="searchText"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        label="Search by employer name"
        variant="solo"
        hide-details
        :single-line="true"
        class="flex-shrink-1 flex-grow-0"
        @keyup.enter="search()"
      >
      </v-text-field>
    </div>

    <div class="d-flex flex-column flex-grow-1 ma-2 ml-0">
      <h5>
        Calendar Year(s)
        <ToolTip
          :text="'Select a calendar year to view employers by the first date they logged in.'"
          max-width="300px"
        ></ToolTip>
      </h5>
      <v-select
        v-model="selectedYears"
        :items="yearOptions"
        :persistent-placeholder="true"
        placeholder="All"
        label="Calendar Year(s)"
        aria-label="Calendar Year(s)"
        :single-line="true"
        multiple
        class="calendar-year flex-shrink-1 flex-grow-0"
        variant="solo"
        density="compact"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :title="`${item.raw}`">
            <template #append="{ isActive }">
              <v-list-item-action start>
                <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
              </v-list-item-action>
            </template>
          </v-list-item>
        </template>
        <template #selection="{ item, index }">
          <v-chip v-if="index < maxSelectedYearShown">
            <span>{{ item.raw }}</span>
          </v-chip>
          <span
            v-if="index === maxSelectedYearShown"
            class="text-grey text-caption align-self-center"
          >
            (+{{ selectedYears.length - maxSelectedYearShown }}
            more)
          </span>
        </template>
      </v-select>
    </div>
    <DateRangeFilter v-model="dateRange" label="First Log In Date Range" />
    <div class="d-flex flex-column ma-2 mr-0">
      <h5>&nbsp;</h5>
    </div>
    <div class="d-flex flex-column ml-auto ma-2 mr-0">
      <div
        class="d-flex"
        :class="
          displayBreakpoint.name.value.valueOf() == 'md'
            ? 'justify-end'
            : 'justify-start'
        "
      >
        <v-btn
          class="btn-primary me-2"
          :loading="isSearching"
          :disabled="isSearching"
          @click="search()"
        >
          Search
        </v-btn>
        <v-btn class="btn-secondary" :disabled="!isDirty" @click="reset()">
          Reset
        </v-btn>
      </div>
    </div>
  </v-row>

  <v-row v-if="hasSearched" dense class="w-100">
    <v-col>
      <v-data-table-server
        v-model:items-per-page="pageSize"
        :headers="headers"
        :items="searchResults"
        :items-length="totalNum"
        :loading="isSearching"
        :items-per-page-options="pageSizeOptions"
        search=""
        :no-data-text="
          hasSearched ? 'No reports matched the search criteria' : ''
        "
      >
        <template #[`item.create_date`]="{ item }">
          {{ formatDate(item.create_date) }}
        </template>
      </v-data-table-server>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatDate } from '../utils/date';
import {
  Employer,
  EmployerFilterType,
  EmployerSortType,
  EmployerKeyEnum,
} from '../types/employers';
import { useDisplay } from 'vuetify';
import { NotificationService } from '../services/notificationService';
import ToolTip from './ToolTip.vue';
import DateRangeFilter from './DateRangeFilter.vue';
import ApiService from '../services/apiService';
import { DateTimeFormatter, nativeJs, ZonedDateTime } from '@js-joda/core';
import { VDataTable } from 'vuetify/components';

const displayBreakpoint = useDisplay();
const firstSearchableYear = 2024;
const currentYear = new Date().getFullYear();
//make a list of years from 'firstSearchableYear' to 'currentYear'
const yearOptions = new Array(currentYear - firstSearchableYear + 1)
  .fill(0)
  .map((d, i) => i + firstSearchableYear);
const searchText = ref<string | undefined>(undefined);
const selectedYears = ref<number[]>([]);
const dateRange = ref<Date[] | undefined>(undefined);
const maxSelectedYearShown = 2;

const pageSizeDefault = 25;
const pageSizeOptions: number[] = [10, pageSizeDefault, 50];
const pageSize = ref<number>(pageSizeDefault);
const searchResults = ref<Employer[]>([]);
const totalNum = ref<number>(0);
const isSearching = ref<boolean>(false);
const hasSearched = ref<boolean>(false);

const isDirty = computed(() => {
  return (
    hasSearched.value ||
    searchText.value ||
    selectedYears.value?.length ||
    dateRange.value?.length
  );
});

type ReadonlyHeaders = VDataTable['$props']['headers'];
const headers = ref<ReadonlyHeaders>([
  {
    title: 'Employer Name',
    align: 'start',
    sortable: true,
    key: 'company_name',
  },
  {
    title: 'Date of First Log In',
    align: 'start',
    sortable: true,
    key: 'create_date',
  },
]);

function reset() {
  searchText.value = undefined;
  selectedYears.value = [];
  dateRange.value = undefined;
  pageSize.value = pageSizeDefault;
  searchResults.value = [];
  totalNum.value = 0;
  hasSearched.value = false;
}

function buildSearchFilters(): EmployerFilterType {
  const filters: EmployerFilterType = [];
  if (searchText.value) {
    filters.push({
      key: EmployerKeyEnum.Name,
      value: searchText.value,
      operation: 'like',
    });
  }
  if (selectedYears.value?.length) {
    filters.push({
      key: EmployerKeyEnum.Year,
      value: selectedYears.value,
      operation: 'in',
    });
  }
  if (dateRange.value) {
    filters.push({
      key: EmployerKeyEnum.Date,
      operation: 'between',
      value: dateRange.value.map((d, i) => {
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
  return filters;
}

function buildSort(sortOptions): EmployerSortType {
  const sort: EmployerSortType = sortOptions?.map((d) => {
    return { field: d.key, order: d.order };
  });
  return sort;
}

async function search(options?) {
  isSearching.value = true;
  try {
    const offset = options ? (options.page - 1) * options.itemsPerPage : 0;
    const limit = pageSize.value;
    const filter: EmployerFilterType = buildSearchFilters();
    const sort: EmployerSortType = buildSort(options?.sortBy);
    const resp = await ApiService.getEmployers(offset, limit, filter, sort);
    searchResults.value = resp?.employers;
    totalNum.value = resp?.total;
  } catch (e) {
    console.log(e);
    NotificationService.pushNotificationError('Unable to search employers');
  } finally {
    hasSearched.value = true;
    isSearching.value = false;
  }
}
</script>
<style>
.v-select > .v-input__details {
  display: none;
}
.v-input.calendar-year label {
  background-color: red;
}
/* 200% of the default flex-basis. (ie double the size) */
.flex-basis-200 {
  flex-basis: 300px;
}
</style>
