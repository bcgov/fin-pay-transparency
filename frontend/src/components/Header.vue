<template>
  <v-app-bar
      absolute
      color="rgb(0, 51, 102)"
      class="sysBar"
      style="z-index: 1002;"
      :class="{'pl-2': $vuetify.display.smAndDown, 'pl-10': $vuetify.display.mdAndUp, 'pr-2': $vuetify.display.smAndDown, 'pr-10': $vuetify.display.mdAndUp} "
  >
    <!-- Navbar content -->
    <a
        tabindex="-1"
        href="/"
    >
      <img
          tabindex="-1"
          src="../assets/images/bc-gov-logo.svg"
          width="155"
          class="logo"
          alt="B.C. Government Logo"
      >
    </a>
    <a
        tabindex="-1"
        href="/"
    >
      <v-toolbar-title><h3
          class="mainTitle"
          style="color:white"
      >{{ appTitle }}</h3></v-toolbar-title>
    </a>
    
    <v-spacer />

    <template v-slot:append>
      <v-menu
        v-model="menu"
        v-if="isAuthenticated"
        :close-on-content-click="false"
        location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            color="white"
            v-bind="props"
            icon="mdi-account"
          ></v-btn>
        </template>
        <v-card min-width="250">
          <template v-slot:prepend>
            <v-list>
              <v-list-item>
                <v-list-item-title class="styles-override">{{ userInfo?.displayName }}</v-list-item-title>
                <v-list-item-subtitle class="styles-override">{{ userInfo?.legalName }}</v-list-item-subtitle>
                <v-list-item-subtitle class="styles-override">{{ `${userInfo?.addressLine1 ? userInfo?.addressLine1 : ""} ${userInfo?.addressLine2 ? userInfo?.addressLine2 : ""}`.trim() }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </template>
          <template v-slot:append>
            <v-card-actions>
              <v-tooltip text="Logout" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-logout"></v-btn>
                </template>
              </v-tooltip>               
            </v-card-actions>
          </template>
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
      authRoutesLogout: sanitizeUrl(AuthRoutes.LOGOUT)
    };
  },
  computed: {
    ...mapState(authStore, ['isAuthenticated']),
    ...mapState(authStore, ['userInfo']),
  },
  methods: {
    redirectToLogout() {
      window.location.href = this.authRoutesLogout;
    }
  }
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
  padding-top: 10px
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
    font-size: 1.0rem;
  }

  .display-name {
    display: none;
  }
}
</style>
