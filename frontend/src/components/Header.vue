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

    <v-btn v-if="isAuthenticated" :href="authRoutes.LOGOUT">
      Logout
    </v-btn>
  </v-app-bar>
</template>

<script>
import { mapState } from 'pinia';
import { authStore } from '../store/modules/auth';
import { AuthRoutes } from '../utils/constant';

export default {
  data() {
    return {
      appTitle: 'Pay Transparency Reporting',
      authRoutes: AuthRoutes
    };
  },
  computed: {
    ...mapState(authStore, ['isAuthenticated']),
  },
  methods: {}
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
