<template>
  <v-app id="app">
    <MsieBanner v-if="isIE" />
    <div v-if="!isIE">
      <SnackBar />
      <SideBar v-if="areHeaderAndSidebarVisible" />
      <Header v-if="areHeaderAndSidebarVisible" />
      <v-main
        fluid
        class="d-flex flex-column align-start"
        :class="{ 'ptap-panel': areHeaderAndSidebarVisible }"
      >
        <div v-if="isTitleVisible || isBreadcrumbTrailVisible" class="mb-3">
          <h2 class="page-title" v-if="isTitleVisible">
            {{ activeRoute.meta.pageTitle }}
          </h2>
          <BreadcrumbTrail
            class="pt-0 pb-0"
            v-if="isBreadcrumbTrailVisible"
          ></BreadcrumbTrail>
        </div>
        <router-view />
      </v-main>
    </div>
  </v-app>
</template>

<script>
import { appStore } from './store/modules/app';
import { mapActions, mapState } from 'pinia';
import Header from './components/Header.vue';
import SideBar from './components/SideBar.vue';
import MsieBanner from './components/MsieBanner.vue';
import SnackBar from './components/util/SnackBar.vue';
import BreadcrumbTrail from './components/BreadcrumbTrail.vue';
import { NotificationService } from './services/notificationService';
import { authStore } from './store/modules/auth';
import { USER_ROLE_NAME } from './constants';

export default {
  name: 'App',
  components: {
    Header,
    SideBar,
    MsieBanner,
    SnackBar,
    BreadcrumbTrail,
  },
  data() {
    return {
      areHeaderAndSidebarVisible: false,
      isTitleVisible: false,
      isBreadcrumbTrailVisible: false,
      activeRoute: null,
    };
  },
  computed: {
    ...mapState(appStore, ['pageTitle']),
    ...mapState(authStore, ['isAuthenticated']),
    isIE() {
      return /Trident\/|MSIE/.test(window.navigator.userAgent);
    },
  },
  watch: {
    $route: {
      handler(to, from) {
        this.onRouteChanged(to, from);
      },
    },
  },
  async created() {},
  methods: {
    appStore,
    ...mapActions(authStore, ['doesUserHaveRole']),
    onRouteChanged(to, from) {
      this.activeRoute = to;
      if (to.fullPath != '/error') {
        //Reset error page message back to the default
        NotificationService.setErrorPageMessage();
      }
      this.areHeaderAndSidebarVisible = to.meta.requiresAuth;
      this.isTitleVisible = to?.meta?.isTitleVisible && to?.meta?.pageTitle;
      this.isBreadcrumbTrailVisible =
        to?.meta?.isBreadcrumbTrailVisible &&
        this.doesUserHaveRole(USER_ROLE_NAME);
    },
  },
};
</script>

<style lang="scss">
@import '@bcgov/bc-sans/css/BCSans.css';

$link-color: #255a90;

.ptap-panel {
  margin: 24px !important;
}

a {
  color: $link-color;
}

.v-main {
  padding: 0;
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
  font-weight: 600 !important;
}

button:disabled.v-btn {
  background-color: #eeeeee !important;
  color: #aaaaaa !important;
  border: 1px solid #cccccc !important;
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

.v-btn.btn-link {
  text-decoration: underline;
  color: $link-color;
  background-color: transparent !important;
  border: none;
  box-shadow: none;
}

.v-alert .v-icon {
  padding-left: 0;
}

.v-alert {
  display: flex !important;
  color: #2d2d2d !important;
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
