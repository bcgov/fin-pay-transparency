<template>
  <v-app-bar absolute style="z-index: 1002" class="d-flex justify-center">
    <v-container>
      <span class="text-primary page-title">Gender Equity Office</span>
    </v-container>
  </v-app-bar>
  <v-row class="fill-height container">
    <v-col xs="12" class="d-flex flex-column justify-center align-center action">
      <div class="d-flex flex-column">
        <p class="title text-h4">Log in</p>
        <v-btn
          id="login-button"
          class="btn-primary login-button"
          data-testid="login-button"
          @click="clearStorageAndRedirectToLogin"
          title="Login"
        >
          Log in with IDIR
        </v-btn>
      </div>
    </v-col>
    <v-col xs="12" class="justify-center cover d-none d-xs-none d-sm-none d-md-flex"> </v-col>
  </v-row>
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
      authRoutesLogin: sanitizeUrl(AuthRoutes.LOGIN_AZUREIDIR),
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
