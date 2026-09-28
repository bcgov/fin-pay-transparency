<template>
  <div
    v-if="!reportUrlHistory?.length"
    class="d-flex flex-column flex-grow-1 flex-shrink-0 justify-center align-center"
  >
    No URLs to show
  </div>
  <div v-if="reportUrlHistory?.length" class="d-flex flex-column">
    <div
      v-for="item in reportUrlHistory"
      :key="item.url_id + item.url_history_id"
      class="d-flex flex-column"
    >
      <v-row no-gutters>
        <v-col class="text-success url-link">
          <v-icon icon="mdi-open-in-new" color="success" class="mr-1" />
          <a
            :href="item.report_url"
            target="_blank"
            rel="noopener noreferrer"
            class=""
          >
            {{ item.report_url }}
          </a>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col class="d-flex justify-center py-1 first-column"
          ><div class="vertical-bar"></div
        ></v-col>
        <v-col class="mb-3">
          <div v-if="item.update_date" class="d-flex align-center">
            <div>
              {{ formatIsoDateTimeAsLocalDate(item.update_date) }}
            </div>
            <small class="text-grey-darken-3 ms-2">
              {{ formatIsoDateTimeAsLocalTime(item.update_date) }}</small
            >
          </div>
        </v-col>
      </v-row>
    </div>
    <div v-if="reportUrlHistory.length >= 100" class="d-flex flex-column">
      Results are limited to the 100 most recent items. Older items may not be
      shown.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ReportUrlHistory } from '../../types/reports';
import {
  formatIsoDateTimeAsLocalDate,
  formatIsoDateTimeAsLocalTime,
} from '../../utils/date';

defineProps<{
  reportUrlHistory: ReportUrlHistory[];
}>();
</script>
<style>
.first-column {
  max-width: 25px !important;
  margin-right: 4px;
}
.vertical-bar {
  width: 3px;
  background-color: #dddddd;
  height: 100%;
}
.url-link {
  display: block; /* required for ellipsis */
  /* max-width: 100%; required for ellipsis */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* prevents wrapping */
}
</style>
