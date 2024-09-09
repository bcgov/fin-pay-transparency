<template>
  <div class="primary-filters">
    <v-row dense class="mt-0 w-100 mb-4">
      <v-col sm="7" md="8" lg="6" xl="4" class="d-flex align-center">
        <v-text-field
          v-model="searchText"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          label="Search by title"
          variant="solo"
          hide-details
          :single-line="true"
          @keyup.enter="searchAnnouncements()"
        >
          <template v-slot:append> </template>
        </v-text-field>
        <v-btn class="btn-primary" @click="searchAnnouncements()">
          Search
        </v-btn>
      </v-col>
      <v-col
        sm="5"
        md="4"
        lg="6"
        xl="8"
        class="d-flex justify-end align-center pe-3"
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

  <div class="secondary-filters py-4" v-if="areSecondaryFiltersVisible">
    <v-row dense>
      <v-col sm="6" md="6" lg="4" xl="3" class="d-flex flex-column">
        <h5>Active On date</h5>
        <VueDatePicker
          v-model="publishDateRange"
          range
          placeholder="Select date range"
          format="yyyy-MM-dd"
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

      <v-col sm="6" md="6" lg="4" xl="3" class="d-flex flex-column">
        <h5>Expiry date</h5>
        <VueDatePicker
          v-model="expiryDateRange"
          range
          format="yyyy-MM-dd"
          :enable-time-picker="false"
          arrow-navigation
          auto-apply
          prevent-min-max-navigation
          placeholder="Select date range"
        >
          <template #day="{ day, date }">
            <span :aria-label="formatDate(date)">
              {{ day }}
            </span>
          </template>
        </VueDatePicker>
      </v-col>

      <v-col sm="6" md="6" lg="4" xl="3" class="d-flex flex-column">
        <h5>Status</h5>
        <v-select
          v-model="selectedStatuses"
          :items="statusOptions"
          :persistent-placeholder="true"
          multiple
          placeholder="All"
          variant="solo"
          density="compact"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw">
              <template v-slot:title="{ title }">
                <span v-if="item.raw">
                  <AnnouncementStatusChip
                    :status="title"
                  ></AnnouncementStatusChip>
                </span>
                <span v-if="!item.raw">{{ title }}</span>
              </template>
              <template v-slot:append="{ isActive }">
                <v-icon v-if="isActive" icon="mdi-check"></v-icon>
              </template>
            </v-list-item>
          </template>
          <template v-slot:selection="{ item, index }">
            <span v-if="!item.raw">All</span>
            <span v-if="item.raw">
              <AnnouncementStatusChip
                v-if="index < maxSelectedStatusesVisible"
                :status="item.title"
              ></AnnouncementStatusChip>
              <span
                v-if="index === maxSelectedStatusesVisible"
                class="text-grey text-caption align-self-center"
              >
                (+{{ selectedStatuses.length - maxSelectedStatusesVisible }}
                more)
              </span>
            </span>
          </template>
        </v-select>
      </v-col>

      <v-col
        sm="4"
        md="1"
        lg="2"
        xl="2"
        offset-sm="2"
        offset-md="5"
        offset-lg="10"
        offset-xl="0"
        class="align-stretch"
      >
        <h5>&nbsp;</h5>
        <div class="d-flex justify-end align-center filter-buttons">
          <v-btn class="btn-primary mr-0" @click="searchAnnouncements()">
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
  name: 'AnnouncementSearchFilters',
};
</script>

<script setup lang="ts">
import AnnouncementStatusChip from './AnnouncementStatusChip.vue';
import { ref, onMounted } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import { useAnnouncementSearchStore } from '../../store/modules/announcementSearchStore';
import '@vuepic/vue-datepicker/dist/main.css';
import {
  AnnouncementFilterType,
  AnnouncementStatus,
} from '../../types/announcements';
import {
  ZonedDateTime,
  nativeJs,
  DateTimeFormatter,
  ZoneId,
  LocalDate,
} from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';

const announcementSearchStore = useAnnouncementSearchStore();

const searchText = ref<string | undefined>(undefined);
const publishDateRange = ref<any[] | undefined>(undefined);
const expiryDateRange = ref<any[] | undefined>(undefined);
const selectedStatuses = ref([]);
const areSecondaryFiltersVisible = ref<boolean>(false);
const maxSelectedStatusesVisible = ref(3);

const statusOptions = ref([
  AnnouncementStatus.Published,
  AnnouncementStatus.Draft,
  AnnouncementStatus.Expired,
]);

const formatDate = (date: Date) => {
  return LocalDate.from(nativeJs(date)).format(
    DateTimeFormatter.ofPattern('EEEE d MMMM yyyy').withLocale(Locale.CANADA),
  );
};

function getAnnouncementSearchFilters(): AnnouncementFilterType {
  const filters: any[] = [];
  if (searchText.value) {
    filters.push({
      key: 'title',
      operation: 'like',
      value: searchText.value,
    });
  }
  if (publishDateRange.value) {
    filters.push({
      key: 'active_on',
      operation: 'between',
      value: publishDateRange.value.map(toApiDateTime),
    });
  }
  if (expiryDateRange.value) {
    filters.push({
      key: 'expires_on',
      operation: 'between',
      value: expiryDateRange.value.map(toApiDateTime),
    });
  }
  if (selectedStatuses.value?.length) {
    filters.push({
      key: 'status',
      operation: 'in',
      value: selectedStatuses.value,
    });
  }
  return filters;
}

async function searchAnnouncements() {
  const params = {
    filter: getAnnouncementSearchFilters(),
  };
  announcementSearchStore.searchAnnouncements(params);
}

function toApiDateTime(d, i) {
  const jodaZonedDateTime = ZonedDateTime.from(nativeJs(d)).withZoneSameLocal(
    ZoneId.of('UTC'),
  );
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
    publishDateRange.value != undefined ||
    expiryDateRange.value != undefined ||
    selectedStatuses.value?.length != 0
  );
}

function clear() {
  searchText.value = undefined;
  publishDateRange.value = undefined;
  expiryDateRange.value = undefined;
  selectedStatuses.value = [];
  announcementSearchStore.reset();
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
