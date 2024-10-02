<template>
  <v-row dense class="mt-0 w-100 mb-4">
    <v-col sm="12" md="7" lg="6" xl="4" class="d-flex flex-column justify-end">
      <h3 class="mb-2">Search employer</h3>
      <v-text-field
        v-model="searchText"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        label="Search by employer name"
        variant="solo"
        hide-details
        :single-line="true"
        class="flex-shrink-1 flex-grow-0"
        @keyup.enter="search()"
      >
      </v-text-field>
    </v-col>

    <v-col sm="9" md="4" lg="4" xl="2" class="d-flex flex-column justify-end">
      <h5 class="mt-4">Calendar year(s)</h5>
      <v-select
        v-model="selectedYears"
        :items="yearOptions"
        :persistent-placeholder="true"
        placeholder="All"
        multiple
        class="flex-shrink-1 flex-grow-0"
        variant="solo"
        density="compact"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :title="`${item.raw}`">
            <template #append="{ isActive }">
              <v-list-item-action start>
                <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
              </v-list-item-action>
            </template>
          </v-list-item>
        </template>
        <template #selection="{ item, index }">
          <v-chip v-if="index < maxSelectedYearShown">
            <span>{{ item.raw }}</span>
          </v-chip>
          <span
            v-if="index === maxSelectedYearShown"
            class="text-grey text-caption align-self-center"
          >
            (+{{ selectedYears.length - maxSelectedYearShown }}
            more)
          </span>
        </template>
      </v-select>
    </v-col>
    <v-col sm="3" md="1" lg="1" xl="1" class="d-flex flex-column justify-end">
      <v-btn class="btn-primary" @click="search()"> Search </v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const searchText = ref<string | undefined>(undefined);
const selectedYears = ref<number[]>([]);
const yearOptions = [2024, 2023];
const maxSelectedYearShown = 2;

function search() {}
</script>
<style>
.v-select > .v-input__details {
  display: none;
}
</style>
