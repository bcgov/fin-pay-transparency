<template>
  <v-chip
    :class="{
      success: status == 'PUBLISHED',
      warning: status == 'EXPIRED',
      info: !['PUBLISHED', 'EXPIRED'].includes(status),
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

<script setup lang="ts"></script>
