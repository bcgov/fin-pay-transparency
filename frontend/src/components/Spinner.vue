<template>
  <v-card
    :flat="flat"
    class="mx-auto pa-4"
  >
    <v-row
      align="center"
      justify="center"  
      class="v-row-pretty"
    >
      <v-progress-circular
        :size="70"
        :width="7"
        color="primary"
        indeterminate='disable-shrink' 
      />
    </v-row>
  </v-card>
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
.v-row-pretty {
    min-height: 14em;
    height: 100% !important;
}
</style>
