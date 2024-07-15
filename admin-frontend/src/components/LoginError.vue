<template>
  <AuthLayout>
    <template #content>
      <h1 class="title mb-2">Login Error</h1>
      <v-alert dense variant="outlined" class="alert-error mb-3">
        Something went wrong during the login process.
      </v-alert>
      <div>
        <v-btn class="btn-primary" to="Login">Try logging in again</v-btn>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from './util/AuthLayout.vue';
</script>

<styles>
</styles>
