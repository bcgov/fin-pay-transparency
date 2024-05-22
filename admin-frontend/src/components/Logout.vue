<template>
  <v-container>
    <v-row align="center" justify="center">
      <v-col xs="4" sm="4" md="4" lg="4" xl="4">
        <v-alert dense variant="outlined" class="mb-3 alert-info">
          You have logged out.
        </v-alert>
        <v-btn class="btn-primary" @click="redirectToLogin">Login Again</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { AuthRoutes } from '../utils/constant';
import { authStore } from '../store/modules/auth';
import { sanitizeUrl } from '@braintree/sanitize-url';

export default {
  name: 'Logout',

  data() {
    return {
      authRoutesLogin: sanitizeUrl(AuthRoutes.LOGIN_BCEID),
    };
  },
  mounted() {
    authStore().setJwtToken();
  },
  methods: {
    redirectToLogin() {
      authStore().setJwtToken();
      window.location.href = this.authRoutesLogin;
    },
  },
};
</script>

<style scoped>
.full-height {
  height: 100%;
}
.session-expired-card {
  margin-top: 15rem;
  width: 100%;
  background: #d9e7d8;
}
</style>
