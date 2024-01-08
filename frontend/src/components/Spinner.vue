<template>
  <v-progress-circular
    :size="70"
    :width="7"
    color="primary"
    indeterminate='disable-shrink' 
  />
</template>

<script>
export default {
  name: 'Spinner',
  props: {
    flat: {
      type: Boolean,
      default: false
    },
  }
};
</script>

<style scoped>
.v-card--variant-elevated {
    box-shadow: none;
    height: 100% !important;
}
</style>
