<template>
  <div
    v-if="!reportAdminActionHistory?.length"
    class="d-flex flex-column flex-grow-1 flex-shrink-0 justify-center align-center"
  >
    No admin events to show
  </div>
  <div v-if="reportAdminActionHistory?.length" class="d-flex flex-column">
    <div
      v-for="item in reportAdminActionHistory"
      :key="item.report_history_id"
      class="d-flex flex-column"
    >
      <v-row no-gutters>
        <v-col class="d-flex justify-center first-column">
          <v-icon
            :icon="
              item.action === AdminModifiedReason.UNLOCK
                ? 'mdi-lock-open'
                : item.action === AdminModifiedReason.LOCK
                  ? 'mdi-lock'
                  : 'mdi-delete'
            "
            :color="
              item.action === AdminModifiedReason.UNLOCK
                ? 'success'
                : item.action === AdminModifiedReason.LOCK
                  ? 'error'
                  : 'warning'
            "
          ></v-icon>
        </v-col>
        <v-col
          :class="
            item.action === AdminModifiedReason.UNLOCK
              ? 'text-success'
              : item.action === AdminModifiedReason.LOCK
                ? 'text-error'
                : 'text-warning'
          "
        >
          <b>{{ AdminModifiedReasonDisplay[item.action] }}</b>
        </v-col>
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
          <div v-if="item?.admin_user_display_name">
            By {{ item.admin_user_display_name }}
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
import {
  AdminModifiedReason,
  AdminModifiedReasonDisplay,
  ReportAdminActionHistory,
} from '../../types/reports';
import {
  formatIsoDateTimeAsLocalDate,
  formatIsoDateTimeAsLocalTime,
} from '../../utils/date';

defineProps<{
  reportAdminActionHistory: ReportAdminActionHistory[];
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
