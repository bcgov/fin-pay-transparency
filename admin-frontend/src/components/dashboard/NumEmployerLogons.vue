<template>
  <v-card class="ptap-widget">
    <v-card-text class="h-100 d-flex flex-column">
      <div class="widget-header flex-grow-0 flex-shrink-0">
        Total number of employers who have logged on to date
      </div>
      <div
        class="d-flex flex-column justify-center align-center text-primary flex-grow-1 flex-shrink-0"
      >
        <v-skeleton-loader v-if="isLoading" type="avatar"></v-skeleton-loader>
        <div v-if="!isLoading">
          <span v-if="hasError">
            <v-tooltip text="Unable to load the data">
              <template #activator="{ props }">
                <v-icon
                  icon="mdi-alert"
                  size="x-large"
                  color="grey"
                  v-bind="props"
                  @click="refresh"
                ></v-icon>
              </template>
            </v-tooltip>
          </span>
          <span v-if="!hasError" class="widget-value">{{
            numEmployersWhoHaveLoggedOn
          }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import ApiService from '../../services/apiService';
import { ref, onMounted } from 'vue';
import { EmployerMetrics } from '../../types/employers';

onMounted(() => {
  refresh();
});

const numEmployersWhoHaveLoggedOn = ref<number | null>();
const hasError = ref<boolean>(false);
const isLoading = ref<boolean>(false);

async function refresh() {
  hasError.value = false;
  isLoading.value = true;
  try {
    const employerMetrics: EmployerMetrics =
      await ApiService.getEmployerMetrics();
    numEmployersWhoHaveLoggedOn.value =
      employerMetrics?.num_employers_logged_on_to_date;
  } catch (e) {
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
}

defineExpose({
  refresh,
});
</script>

<style lang="scss">
.widget-header {
  font-size: 1.2em;
}
.widget-value {
  font-size: 6em;
  font-weight: bold;
}
</style>
