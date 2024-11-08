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
<script lang="ts">
export default {
  name: 'AnnouncementStatusChip',
  props: ['status'],
};
</script>

<script setup lang="ts">
import { AnnouncementStatus } from '../../types/announcements';
</script>
