<template>
  Login page placeholder
  <v-btn
    id="login-button"
    class="btn-primary"
    data-testid="login-button"
    @click="clearStorageAndRedirectToLogin"
    title="Login"
  >
    Log in with IDIR
  </v-btn>
</template>

<script>
import { authStore } from '../store/modules/auth';
import { AuthRoutes } from '../utils/constant';
import { sanitizeUrl } from '@braintree/sanitize-url';

export default {
  name: 'Login',
  components: {},
  data() {
    return {
      appTitle: 'Pay Transparency Admin Dashboard',
      authRoutesLogin: sanitizeUrl(AuthRoutes.LOGIN_IDIR),
    };
  },
  computed: {},
  methods: {
    sanitizeUrl: sanitizeUrl,
    clearStorageAndRedirectToLogin() {
      authStore().setJwtToken();
      window.location.href = this.authRoutesLogin;
    },
  },
};
</script>

<style scoped lang="scss"></style>
