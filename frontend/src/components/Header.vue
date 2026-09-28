<template>
  <v-app-bar absolute style="z-index: 1002">
    <v-container class="d-flex">
      <a tabindex="-1" href="/" class="d-flex align-center">
        <img
          tabindex="-1"
          src="../assets/images/bc-gov-logo-light.png"
          width="155"
          class="logo"
          alt="B.C. Government Logo"
        />
        <v-toolbar-title
          ><h3
            data-testid="header-title"
            class="mainTitle"
            style="color: rgb(32, 31, 30)"
          >
            {{ appTitle }}
          </h3></v-toolbar-title
        >
      </a>

      <v-spacer />

      <v-menu
        v-if="isAuthenticated"
        v-model="menu"
        :close-on-content-click="false"
        data-testid="header-account-menu"
      >
        <template #activator="{ props }">
          <v-btn
            id="header-account-button"
            color="rgb(32, 31, 30)"
            v-bind="props"
            arial-label="User profile"
            icon="mdi-account"
            data-testid="header-account-button"
            title="User profile"
          ></v-btn>
        </template>
        <v-card
          :titlex="userInfo?.displayName"
          :subtitlex="userInfo?.legalName"
          min-width="250"
        >
          <v-card-title data-testid="header-display-name">
            {{ userInfo?.displayName }}
          </v-card-title>
          <v-card-subtitle data-testid="header-legal-name">
            {{ userInfo?.legalName }}
          </v-card-subtitle>

          <v-divider class="mt-4" />

          <v-card-actions>
            <v-tooltip text="Logout" location="bottom">
              <template #activator="{ props }">
                <v-spacer />
                <v-btn
                  v-bind="props"
                  icon="mdi-logout"
                  data-testid="header-logout-button"
                  title="Logout"
                  aria-label="Logout"
                  @click="redirectToLogout"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-card-actions>
        </v-card>
      </v-menu>
    </v-container>
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
    };
  },
  computed: {
    ...mapState(authStore, ['isAuthenticated']),
    ...mapState(authStore, ['userInfo']),
  },
  methods: {
    redirectToLogout() {
      globalThis.location.href = this.authRoutesLogout;
    },
  },
};
</script>

<style scoped lang="scss">
.mainTitle {
  font-size: 1.2rem;
}

a {
  text-decoration: none;
}

.logo {
  padding-right: 30px;
}

@media screen and (max-width: 801px) {
  .logo {
    width: 100px;
  }

  .mainTitle {
    font-size: 1rem;
  }
}
</style>
