<template>
  <div v-if="!reportAdminActionHistory?.length">No admin events to show</div>
  <div v-if="reportAdminActionHistory?.length" class="d-flex flex-column">
    <div
      v-for="item in reportAdminActionHistory"
      :key="item.report_history_id"
      class="d-flex flex-column"
    >
      <v-row no-gutters>
        <v-col class="d-flex justify-center first-column">
          <v-icon
            :icon="item.is_unlocked ? 'mdi-lock-open' : 'mdi-lock'"
            :color="item.is_unlocked ? 'success' : 'error'"
          ></v-icon>
        </v-col>
        <v-col :class="item.is_unlocked ? 'text-success' : 'text-error'"
          ><b>{{ item.is_unlocked ? 'Unlocked' : 'Locked' }}</b></v-col
        >
      </v-row>
      <v-row no-gutters>
        <v-col class="d-flex justify-center py-1 first-column"
          ><div class="vertical-bar"></div
        ></v-col>
        <v-col class="mb-3">
          <div v-if="item.admin_modified_date" class="d-flex align-center">
            <div>
              {{ formatIsoDateTimeAsLocalDate(item.admin_modified_date) }}
            </div>
            <small class="text-grey-darken-3 ms-2">
              {{
                formatIsoDateTimeAsLocalTime(item.admin_modified_date)
              }}</small
            >
          </div>
          <div v-if="item?.admin_user?.display_name">
            By {{ item.admin_user.display_name }}
          </div>
        </v-col>
      </v-row>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'ReportAdminActionHistoryPanel',
};
</script>
<script setup lang="ts">
import { ReportAdminActionHistory } from '../../types/reports';
import {
  formatIsoDateTimeAsLocalDate,
  formatIsoDateTimeAsLocalTime,
} from '../../utils/date';

defineProps<{
  reportAdminActionHistory: ReportAdminActionHistory;
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
</style>
