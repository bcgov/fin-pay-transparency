<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col xs="4" sm="4" md="4" lg="4" xl="4">
        <v-alert
          data-testid="not-found-message"
          dense
          variant="outlined"
          class="alert-error mb-3"
        >
          This page cannot be found.
        </v-alert>
        <v-btn data-testid="dashboard-button" color="primary" to="/dashboard"
          >Return to dashboard</v-btn
        >
      </v-col>
    </v-row>
  </v-container>
</template>
