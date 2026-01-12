<template>
  <AuthLayout>
    <template #content>
      <v-container fluid class="root">
        <h1 class="text-h6 mb-2">Session Expired</h1>
        <v-alert density="compact" variant="outlined" class="alert-error mb-3">
          Your session has expired.
        </v-alert>
        <v-btn class="btn-primary" @click="clearStorageAndRedirectToLogin"
          >Login Again</v-btn
        >
      </v-container>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { authStore } from '../store/modules/auth';
import { AuthRoutes } from '../utils/constant';
import { sanitizeUrl } from '@braintree/sanitize-url';
import AuthLayout from './util/AuthLayout.vue';

const authRoutesLogin = sanitizeUrl(AuthRoutes.LOGIN_AZUREIDIR);

const clearStorageAndRedirectToLogin = () => {
  authStore().setJwtToken();
  globalThis.location.href = authRoutesLogin;
};
</script>
