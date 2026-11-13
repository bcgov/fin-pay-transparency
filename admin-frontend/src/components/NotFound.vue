<template>
  <v-container>
    <v-row class="align-center justify-center">
      <v-col cols="4" sm="4" md="4" lg="4" xl="4">
        <v-alert
          data-testid="not-found-message"
          density="compact"
          variant="outlined"
          class="alert-error mb-3"
        >
          This page cannot be found.
        </v-alert>
        <v-btn-primary data-testid="dashboard-button" to="/dashboard"
          >Return to dashboard</v-btn-primary
        >
      </v-col>
    </v-row>
  </v-container>
</template>
