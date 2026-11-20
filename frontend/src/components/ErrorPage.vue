<template>
  <v-container>
    <v-row class="align-center justify-center">
      <v-col xs="4" sm="4" md="4" lg="4" xl="4">
        <v-alert
          v-if="errorMessage"
          density="compact"
          variant="outlined"
          color="error"
          class="mb-3"
        >
          {{ errorMessage }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { NotificationService } from '../common/notificationService';

export default {
  data: () => ({
    errorMessage: null as string | null,
  }),
  async created() {
    this.errorMessage = NotificationService.getErrorPageMessage();
  },
  methods: {},
};
</script>

<style scoped>
.error-card {
  margin-top: 5%;
  min-width: 30%;
}

.blue-back {
  background-color: aliceblue;
  height: 100%;
}
</style>
