<template>
  <v-card class="ptap-widget">
    <v-card-text class="h-100 d-flex flex-column">
      <div class="widget-header flex-grow-0 flex-shrink-0">
        Number of reports submitted for current reporting year
      </div>
      <div
        class="d-flex justify-center align-center widget-value text-primary flex-grow-1 flex-shrink-0"
      >
        0
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts"></script>
<style lang="scss">
.widget-header {
  font-size: 1.2em;
}
.widget-value {
  font-size: 6em;
  font-weight: bold;
}
</style>
