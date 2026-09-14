<template>
  <v-app-bar
    absolute
    style="z-index: 1002"
    class="d-flex justify-center ps-6 pe-6"
  >
    <h2 v-if="isTitleVisible">
      {{
        activeRoute.meta.sectionTitle
          ? activeRoute.meta.sectionTitle
          : activeRoute.meta.pageTitle
      }}
    </h2>
    <v-spacer />
    <div v-if="isAuthenticated" data-testid="account-info">
      <v-icon icon="mdi-account" size="small" />
      {{ userInfo?.displayName }}
    </div>

    <v-btn
      class="btn-link ms-2"
      v-if="isAuthenticated"
      @click="redirectToLogout()"
      data-testid="logout-btn"
    >
      Logout
    </v-btn>

    <!-- Navbar content -->
  </v-app-bar>
</template>

<script>
import { mapState } from 'pinia';
import { authStore } from '../store/modules/auth';
import { AuthRoutes } from '../utils/constant';
import { sanitizeUrl } from '@braintree/sanitize-url';

export default {
  data() {
    return {
      appTitle: 'Pay Transparency Reporting',
      fav: true,
      menu: false,
      message: false,
      hints: true,
      authRoutesLogout: sanitizeUrl(AuthRoutes.LOGOUT),
      isTitleVisible: false,
      activeRoute: null,
    };
  },
  watch: {
    $route: {
      handler(to, from) {
        this.onRouteChanged(to, from);
      },
      immediate: true,
    },
  },
  computed: {
    ...mapState(authStore, ['isAuthenticated']),
    ...mapState(authStore, ['userInfo']),
  },
  methods: {
    redirectToLogout() {
      globalThis.location.href = this.authRoutesLogout;
    },
    onRouteChanged(to, from) {
      this.activeRoute = to;
      this.isTitleVisible = to?.meta?.isTitleVisible && to?.meta?.pageTitle;
    },
  },
};
</script>

<style scoped lang="scss"></style>
