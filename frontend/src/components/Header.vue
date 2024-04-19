<template>
  <v-app-bar
    absolute
    style="z-index: 1002"
    :class="{
      'pl-2': $vuetify.display.smAndDown,
      'pl-10': $vuetify.display.mdAndUp,
      'pr-2': $vuetify.display.smAndDown,
      'pr-10': $vuetify.display.mdAndUp,
    }"
  >
    <!-- Navbar content -->
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

    <template v-slot:append>
      <v-menu
        v-model="menu"
        v-if="isAuthenticated"
        :close-on-content-click="false"
        location="bottom"
        data-testid="header-account-menu"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            color="rgb(32, 31, 30)"
            v-bind="props"
            arial-label="User profile"
            icon="mdi-account"
            id="header-account-button"
            data-testid="header-account-button"
            title="User profile"
          ></v-btn>
        </template>
        <v-card
          role="listbox"
          aria-labelledby="header-account-button"
          min-width="250"
        >
          <template v-slot:prepend>
            <v-list role="presentation" aria-labelledby="header-account-button">
              <v-list-item role="presentation" :link="false">
                <v-list-item-title
                  data-testid="header-display-name"
                  class="styles-override"
                  role="menuitem"
                  :title="userInfo?.displayName"
                  :aria-label="userInfo?.displayName"
                  >{{ userInfo?.displayName }}</v-list-item-title
                >
                <v-list-item-subtitle
                  data-testid="header-legal-name"
                  class="styles-override"
                  role="menuitem"
                  :title="userInfo?.legalName"
                  :aria-label="userInfo?.legalName"
                  >{{ userInfo?.legalName }}</v-list-item-subtitle
                >
              </v-list-item>
            </v-list>
          </template>

          <v-divider></v-divider>

          <v-card-actions>
            <v-tooltip text="Logout" location="bottom">
              <template v-slot:activator="{ props }">
                <v-spacer></v-spacer>
                <v-btn
                  v-bind="props"
                  icon="mdi-logout"
                  data-testid="header-logout-button"
                  @click="redirectToLogout"
                  title="Logout"
                  aria-label="Logout"
                ></v-btn>
              </template>
            </v-tooltip>
          </v-card-actions>
        </v-card>
      </v-menu>
    </template>
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

<style>
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
