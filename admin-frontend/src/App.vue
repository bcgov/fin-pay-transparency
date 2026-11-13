<template>
  <v-app id="app">
    <MsieBanner v-if="isIE" />
    <template v-if="!isIE">
      <SnackBar />
      <SideBar v-if="areHeaderAndSidebarVisible" />
      <Header v-if="areHeaderAndSidebarVisible" />
      <v-main
        fluid
        class="d-flex flex-column align-start"
        :class="{ 'ptap-panel': areHeaderAndSidebarVisible }"
      >
        <BreadcrumbTrail
          v-if="isBreadcrumbTrailVisible"
          class="pa-0 ma-0 mb-3"
        ></BreadcrumbTrail>

        <router-view />
      </v-main>
    </template>
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
      isBreadcrumbTrailVisible: false,
    };
  },
  computed: {
    ...mapState(appStore, ['pageTitle']),
    ...mapState(authStore, ['isAuthenticated']),
    isIE() {
      return /Trident\/|MSIE/.test(globalThis.navigator.userAgent);
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
      if (to.fullPath != '/error') {
        //Reset error page message back to the default
        NotificationService.setErrorPageMessage();
      }
      this.areHeaderAndSidebarVisible = to.meta.requiresAuth;
      this.isBreadcrumbTrailVisible =
        to?.meta?.breadcrumbs?.length && this.doesUserHaveRole(USER_ROLE_NAME);
    },
  },
};
</script>

<style lang="scss">
@import '@bcgov/bc-sans/css/BC_Sans.css';
$inputHeight: 40px;
$link-color: #255a90;

.ptap-panel {
  margin: 24px !important;
}

.ptap-widget {
  min-height: 315px;
}

/* in Vuetify v3, headers had no margins. This puts all headers back to the expected margins in v4 */
@layer vuetify-core.reset {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p {
    margin: 0;
  }
}

/* VueDatepicker theme */
.dp__theme_light {
  --dp-border-color: rgba(var(--v-border-color), 0.4);
  --dp-border-color-hover: rgba(var(--v-border-color), 0.8);
  --dp-border-color-focus: rgba(var(--v-border-color), 1);
  --dp-danger-color: rgb(var(--v-theme-error));
}

/* Override styles of the Vue3DatePicker so it looks similar to a
  Vuetify control */
input.dp__input {
  height: $inputHeight !important;
  box-shadow:
    0px 3px 1px -2px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)),
    0px 2px 2px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)),
    0px 1px 5px 0px var(--v-shadow-key-ambient-opacity, rgba(0, 0, 0, 0.12));
  padding-top: 7px !important;
  padding-bottom: 7px !important;
  border: none;
}

.dp__input_invalid {
  box-shadow: 0 0 0px var(--dp-danger-color) !important;
  border-color: var(--dp-danger-color) !important;
}
</style>
