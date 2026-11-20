<template>
  <v-chip
    :color="
      status === AnnouncementStatus.Published
        ? 'success'
        : status === AnnouncementStatus.Expired
          ? 'warning'
          : status === AnnouncementStatus.Archived
            ? 'error'
            : 'info'
    "
    size="small"
  >
    {{ status }}
  </v-chip>
</template>

<script setup lang="ts">
import { AnnouncementStatus } from '../../types/announcements';
defineProps<{
  status: AnnouncementStatus;
}>();
</script>
