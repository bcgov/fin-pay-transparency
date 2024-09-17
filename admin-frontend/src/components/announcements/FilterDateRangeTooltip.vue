<template>
  <v-tooltip
    :id="id"
    text="This is a date range selection. Please select the start and end date of the range. For 1 day please click the same date twice"
    width="300px"
  >
    <template #activator="{ props }">
      <v-icon
        v-bind="props"
        icon="fa:fas fa-circle-info"
        size="x-small"
        color="primary"
        class="ml-1"
        tabindex="0"
        role="tooltip"
        :aria-labeledby="id"
      />
    </template>
  </v-tooltip>
</template>
<script setup lang="ts">
import { defineProps } from 'vue';
defineProps<{ id: string }>();
</script>
