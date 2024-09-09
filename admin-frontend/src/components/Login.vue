<template>
  <AuthLayout>
    <template #content>
      <p class="title text-h4">Log in</p>
      <v-btn
        id="login-button"
        class="btn-primary login-button"
        data-testid="login-button"
        @click="clearStorageAndRedirectToLogin"
        title="Login"
      >
        Log in with IDIR MFA
      </v-btn>
    </template>
  </AuthLayout>
  
</template>

<script setup lang="ts">
import AuthLayout from './util/AuthLayout.vue';
import { authStore } from '../store/modules/auth';
import { AuthRoutes } from '../utils/constant';
import { sanitizeUrl } from '@braintree/sanitize-url';

const appTitle = 'Pay Transparency Admin Dashboard';
const authRoutesLogin = sanitizeUrl(AuthRoutes.LOGIN_AZUREIDIR);
const clearStorageAndRedirectToLogin = () => {
  authStore().setJwtToken();
  window.location.href = authRoutesLogin;
};

</script>

<style scoped lang="scss">
.page-title {
  font-size: larger;
}

.container {
  margin: 0;
  width: 100%;
}

.title {
  font-weight: 700;
  margin-bottom: 20px
}

.login-button {
  font-weight: 600;
}

.action {
  height: calc(100vh - 64px);
}

.cover {
  height: calc(100vh - 64px);
  background-image: url('/login-cover.jpeg');
  background-size: cover;
  background-position: center;
}
</style>
