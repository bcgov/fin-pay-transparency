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
