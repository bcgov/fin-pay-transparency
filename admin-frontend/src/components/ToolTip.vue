<template>
  <v-tooltip v-if="text" :id="id" :text="text" :max-width="maxWidth">
    <template #activator="{ props }">
      <v-icon
        v-bind="props"
        icon="fa:fas fa-circle-info"
        size="x-small"
        color="primary"
        class="ml-1"
        tabindex="0"
        role="tooltip"
        :aria-labeledby="ariaLabel ? ariaLabel : text"
      />
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
/**
 * Example usage:
 * <ToolTip
 *         text="My tooltip text"
 *         aria-label="My aria label"
 *         max-width="300px">
 * </ToolTip>
 */

defineProps<{
  id?: string;
  text?: string;
  ariaLabel?: string;
  maxWidth?: string;
}>();
</script>
