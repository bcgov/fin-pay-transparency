<template>
  <h4>Search Reports</h4>

  <v-row class="mt-0 w-100 mb-4">
    <v-col sm="9" md="8" lg="6" xl="4" class="d-flex align-center">
      <v-text-field
        prepend-inner-icon="mdi-magnify"
        density="compact"
        label="Search reports"
        variant="solo"
        hide-details
        single-line
      >
        <template v-slot:append> </template>
      </v-text-field>
      <v-btn class="btn-primary"> Search </v-btn>
    </v-col>
    <v-col sm="3" md="4" lg="6" xl="8" class="d-flex justify-end align-center">
      <v-btn
        class="btn-secondary"
        prepend-icon="mdi-filter"
        :append-icon="isFilterPanelVisible ? 'mdi-arrow-up' : 'mdi-arrow-down'"
        @click="toggleFilterPanelVisible()"
      >
        Filter
      </v-btn>
    </v-col>
  </v-row>

  <v-row class="mt-0 w-100 mb-4" v-if="isFilterPanelVisible">
    <v-col class="py-0">
      <ReportSearchFilters class="extend-to-side-edges" />
    </v-col>
  </v-row>

  <v-row class="mt-0 w-100">
    <v-col sm="9" md="8" lg="6" xl="4" class="d-flex align-center">
      <h4>Displaying ### reports</h4>
    </v-col>
    <v-col sm="3" md="4" lg="6" xl="8" class="d-flex justify-end align-center">
      <v-btn
        class="btn-primary"
        prepend-icon="mdi-export"
        @click="exportResults()"
      >
        Export results
      </v-btn>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'Reports',
};
</script>

<script setup>
import { ref, watch } from 'vue';
import ReportSearchFilters from './ReportSearchFilters.vue';
const isFilterPanelVisible = ref(false);
function toggleFilterPanelVisible() {
  isFilterPanelVisible.value = !isFilterPanelVisible.value;
}

function exportResults() {}
</script>

<style>
.extend-to-side-edges {
  margin-left: -24px;
  margin-right: -48px;
}
</style>
