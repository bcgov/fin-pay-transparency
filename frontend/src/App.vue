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
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';

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
      return /Trident\/|MSIE/.test(globalThis.navigator.userAgent);
    },
  },
  watch: {
    $route(to, from) {
      if (to.fullPath != '/error') {
        //Reset error page message back to the default
        NotificationService.setErrorPageMessage();
      }
    },
  },
  methods: {
    appStore,
  },
};
</script>

<style>
@import '@bcgov/bc-sans/css/BCSans.css';

a {
  color: #255a90;
}

.v-container {
  width: 85%;
  margin-left: auto;
  margin-right: auto;
}

a:hover {
  cursor: pointer;
}

.envBanner {
  font-size: 0.8rem;
}

.v-application {
  font-family: 'BCSans', 'Noto Sans', Verdana, Arial, sans-serif !important;
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

.v-btn.btn-primary {
  background-color: #053662 !important;
  color: #ffffff !important;
  border: none !important;
}

.v-btn.btn-primary:hover {
  background-color: #1e5189 !important;
}

.v-btn.btn-secondary {
  background-color: #ffffff !important;
  color: #2d2d2d !important;
  border: 1px solid #323130 !important;
}

.v-btn.btn-secondary:hover {
  background-color: #edebe9 !important;
}

.v-alert .v-icon {
  padding-left: 0;
}

.v-alert {
  color: #2d2d2d;
}
.v-alert.alert-success {
  background-color: #f6fff8 !important;
  border-color: #42814a !important;
}

.v-alert.alert-info {
  background-color: #f7f9fc !important;
  border-color: #053662 !important;
}

.v-alert.alert-warning {
  background-color: #fef1d8 !important;
  border-color: #f8bb47 !important;
}

.v-alert.alert-error {
  background-color: #f4e1e2 !important;
  border-color: #ce3e39 !important;
}

/* rich-text */

.rich-text ol,
.rich-text ul {
  /* indent lists */
  padding-left: 32px;
}

.rich-text > p:empty,
p.rich-text:empty {
  /* empty <p> elements are shown as blank lines taking a small vertical space */
  height: 10px;
}

/* responsive styles */

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
  background-color: rgba(0, 0, 0, 0.12) !important;
}
</style>
