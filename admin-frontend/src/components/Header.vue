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
      window.location.href = this.authRoutesLogout;
    },
    onRouteChanged(to, from) {
      this.activeRoute = to;
      this.isTitleVisible = to?.meta?.isTitleVisible && to?.meta?.pageTitle;
    },
  },
};
</script>

<style lang="scss">
.gov-header .v-icon {
  padding-left: 10px;
}

.mainTitle {
  font-size: 1.2rem;
}

.display-name {
  color: white;
}

a {
  text-decoration: none;
}

.logo {
  padding-right: 30px;
}

.gov-header .title {
  color: #fff;
  text-decoration: none;
}

.sysBar {
  border-bottom: 2px solid rgb(252, 186, 25) !important;
}

.gov-header .v-btn,
.v-btn--active.title:before,
.v-btn.title:focus:before,
.v-btn.title:hover:before {
  color: #fff;
  background: none;
}

.v-input__slot {
  padding-top: 10px;
}

.top-down {
  padding-top: 20px;
  height: 80%;
}

.v-list-item-title.styles-override {
  font-weight: 600;
  padding-bottom: 5px;
}

.v-list-item-subtitle.styles-override {
  line-height: 1.2rem;
}

@media screen and (max-width: 801px) {
  .logo {
    width: 100px;
  }

  .mainTitle {
    font-size: 1rem;
  }

  .display-name {
    display: none;
  }
}
</style>
