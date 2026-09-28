<template>
  <v-chip
    :class="{
      success: status == AnnouncementStatus.Published,
      warning: status == AnnouncementStatus.Expired,
      info: ![
        AnnouncementStatus.Published,
        AnnouncementStatus.Expired,
      ].includes(status),
      error: status == AnnouncementStatus.Archived,
    }"
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
