<template>
  <v-tooltip :id="id" :text="text ? text : ''" :max-width="maxWidth">
    <template #activator="{ props }">
      <v-icon
        v-bind="props"
        icon="fa:fas fa-circle-info"
        size="x-small"
        color="primary"
        class="ml-1"
        tabindex="0"
        role="tooltip"
        :aria-labeledby="ariaLabel"
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
  id?: string | undefined;
  text?: string | undefined;
  ariaLabel?: string | undefined;
  maxWidth?: string | undefined;
}>();
</script>
