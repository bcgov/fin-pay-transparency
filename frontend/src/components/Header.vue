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
      window.location.href = this.authRoutesLogout;
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
  padding-right: 15px;
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
