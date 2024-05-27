<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col xs="4" sm="4" md="4" lg="4" xl="4">
        <v-btn
          id="login-button"
          class="btn-primary"
          data-testid="login-button"
          @click="clearStorageAndRedirectToLogin"
          title="Login"
        >
          Log in with IDIR
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
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
