<template>
  <v-row dense class="mt-0 w-100 mb-4">
    <v-col sm="12" md="7" lg="6" xl="4" class="d-flex flex-column justify-end">
      <h3 class="mb-2">Search employer</h3>
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
    </v-col>

    <v-col sm="7" md="5" lg="3" xl="2" class="d-flex flex-column justify-end">
      <h5 class="mt-4">
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
    </v-col>
    <v-col sm="4" md="12" lg="3" xl="2" class="d-flex flex-column justify-end">
      <!-- on screen size 'md', right-align the buttons, otherwise left-align them -->
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
    </v-col>
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
        @update:options="updateSearch()"
      >
        <template #item.create_date="{ item }">
          {{ formatDate(item.create_date) }}
        </template>
      </v-data-table-server>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatDate } from '../utils/date';
import { Employer } from '../types/employers';
import { useDisplay } from 'vuetify';
import { NotificationService } from '../services/notificationService';
import ToolTip from './ToolTip.vue';

const displayBreakpoint = useDisplay();
const firstSearchableYear = 2024;
const currentYear = new Date().getFullYear();
//make a list of years from 'firstSearchableYear' to 'currentYear'
const yearOptions = new Array(currentYear - firstSearchableYear + 1)
  .fill(0)
  .map((d, i) => i + firstSearchableYear);
const searchText = ref<string | undefined>(undefined);
const selectedYears = ref<number[]>([]);
const maxSelectedYearShown = 2;

const pageSizeOptions = [1, 3, 10, 25, 50];
const pageSize = ref<number>(pageSizeOptions[1]);
const searchResults = ref<Employer[] | undefined>(undefined);
const totalNum = ref<number>(0);
const isSearching = ref<boolean>(false);
const hasSearched = ref<boolean>(false);

const isDirty = computed(() => {
  return hasSearched.value || searchText.value || selectedYears.value?.length;
});

const headers = ref<any>([
  {
    title: 'Company Name',
    align: 'start',
    sortable: true,
    key: 'company_name',
  },
  {
    title: 'Date of First Log On',
    align: 'start',
    sortable: true,
    key: 'create_date',
  },
]);

function reset() {
  searchText.value = undefined;
  selectedYears.value = [];
  pageSize.value = pageSizeOptions[1];
  searchResults.value = undefined;
  totalNum.value = 0;
  hasSearched.value = false;
}

function search() {
  isSearching.value = true;
  try {
    const all = [
      { company_name: 'bla', create_date: '2024-09-10T18:04:53.781Z' },
      { company_name: 'asdf', create_date: '2024-09-10T18:04:53.781Z' },
      { company_name: '24dsfg', create_date: '2024-09-10T18:04:53.781Z' },
      { company_name: 'tyhdfsg', create_date: '2024-09-10T18:04:53.781Z' },
      { company_name: '24jyu', create_date: '2024-09-10T18:04:53.781Z' },
    ];
    searchResults.value = all.slice(0, 3);
    totalNum.value = all.length;
    throw new Error('');
  } catch (e) {
    NotificationService.pushNotificationError('Unable to search employers');
  } finally {
    hasSearched.value = true;
    isSearching.value = false;
  }
}

function updateSearch() {
  if (!hasSearched.value) {
    return;
  }
  search();
}
</script>
<style>
.v-select > .v-input__details {
  display: none;
}
.v-input.calendar-year label {
  background-color: red;
}
</style>
