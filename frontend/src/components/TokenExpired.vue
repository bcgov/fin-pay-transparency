<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col xs="4" sm="4" md="4" lg="4" xl="4">
        <v-alert dense outlined class="bootstrap-error mb-3">
          Your session has expired.
        </v-alert>
        <v-btn color="primary" :href="authRoutes.LOGIN_BCEID">Login Again</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script >
import { authStore } from '../store/modules/auth';
import { mapState } from 'pinia';
import { AuthRoutes } from '../utils/constant';

export default {
  name: 'TokenExpired',
  components: {

  },
  data() {
    return {
      appTitle: 'Pay Transparency Reporting',
      authRoutes: AuthRoutes
    };
  },
  computed: {
    ...mapState(authStore, ['isAuthenticated']),
  },
  methods: {
    clearStorage() {
      authStore().setJwtToken();
    }
  }
};
</script>

<styles>
</styles>
