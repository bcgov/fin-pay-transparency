<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col xs="4" sm="4" md="4" lg="4" xl="4">
        <v-alert dense variant="outlined" class="alert-error mb-3">
          Something went wrong during the login process.
        </v-alert>
        <v-btn class="btn-primary" to="Login">Try logging in again</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts"></script>

<styles>
</styles>
