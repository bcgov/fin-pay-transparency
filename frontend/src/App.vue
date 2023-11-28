<template>
  <v-app id="app">
    <MsieBanner v-if="isIE" />
    <Header />
    <SnackBar />
    <NavBar v-if="pageTitle" :title="pageTitle" />
    <v-main fluid class="align-start">
      <router-view />
    </v-main>
    <Footer />
  </v-app>
</template>

<script>
import { appStore } from './store/modules/app';
import { mapState } from 'pinia';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import MsieBanner from './components/MsieBanner.vue';
import SnackBar from './components/util/SnackBar.vue';
import { NotificationService } from './common/notificationService';

export default {
  name: 'App',
  components: {
    Header,
    Footer,
    MsieBanner,
    SnackBar,
  },
  computed: {
    ...mapState(appStore, ['pageTitle']),
    isIE() {
      return /Trident\/|MSIE/.test(window.navigator.userAgent);
    }
  },
  watch: {
    '$route'(to, from) {
      if (to.fullPath != "/error") {
        //Reset error page message back to the default
        NotificationService.setErrorPageMessage();
      }
    }
  },
  async created() {

  },
  methods: {
    appStore,
  }
};
</script>

<style>
@import '@bcgov/bc-sans/css/BC_Sans.css';

a {
  color: #1976d2;
}

a:hover {
  cursor: pointer;
}

.envBanner {
  font-size: 0.8rem;
}

.v-application {
  font-family: 'BC Sans', 'Noto Sans', Verdana, Arial, sans-serif !important;
}

.v-card--flat {
  background-color: transparent !important;
}

.theme--light.application {
  background: #f1f1f1;
}

h1 {
  font-size: 1.25rem;
}

.v-toolbar__title {
  font-size: 1rem;
}

.v-btn {
  text-transform: none !important;
}

.v-alert .v-icon {
  padding-left: 0;
}

.v-alert.bootstrap-success {
  color: #234720;
  background-color: #d9e7d8 !important;
  border-color: #accbaa !important;
}

.v-alert.bootstrap-info {
  color: #4e6478;
  background-color: #eaf2fa !important;
  border-color: #b8d4ee !important;
}

.v-alert.bootstrap-warning {
  color: #81692c;
  background-color: #fef4dd !important;
  border-color: #fbdb8b !important;
}

.v-alert.bootstrap-error {
  color: #712024;
  background-color: #f7d8da !important;
  border-color: #eeaaad !important;
}

@media screen and (max-width: 370px) {

  .v-toolbar__title {
    font-size: 0.9rem;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  h1 {
    font-size: 0.9rem;
  }

  .v-application {
    line-height: 1.3;
  }
}

@media screen and (min-width: 371px) and (max-width: 600px) {
  .v-toolbar__title {
    font-size: 0.9rem;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  h1 {
    font-size: 1rem;
  }

  .v-application {
    line-height: 1.3;
  }
}

@media screen and (min-width: 601px) and (max-width: 700px) {
  .v-toolbar__title {
    font-size: 1rem;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  h1 {
    font-size: 1.2rem;
  }
}

.theme--light.v-btn.v-btn--disabled:not(.v-btn--text):not(.v-btn--outlined) {
  background-color: rgba(0, 0, 0, .12) !important;
}
</style>
