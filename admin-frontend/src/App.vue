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
        <BreadcrumbTrail
          v-if="isBreadcrumbTrailVisible"
          class="pt-0 pb-0 mb-3"
        ></BreadcrumbTrail>

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
      isBreadcrumbTrailVisible: false,
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
@import '@bcgov/bc-sans/css/BCSans.css';
$inputHeight: 40px;
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

.v-card-title {
  font-size: 1.35rem !important; //default is 1.25, but BCSans font looks wonky at that size.
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
  background-color: #ffffff !important;
  color: #666666 !important;
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
  color: $link-color;
  background-color: transparent !important;
  border: none;
  box-shadow: none;
  font-weight: normal !important;
  padding: 0px;
  letter-spacing: 1px;
}
.v-btn.btn-link:hover > .v-btn__overlay {
  opacity: 0 !important;
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

.v-chip.success {
  background-color: #f6fff8 !important;
  border-color: #d6e8da !important;
  color: #42814a !important;
}

.v-chip.info {
  background-color: #efefef !important;
  border-color: #efefef !important;
  color: #313131 !important;
}

.v-chip.warning {
  background-color: #fef1d8 !important;
  border-color: #fef1d8 !important;
  color: #ffa600 !important;
}

.v-chip.error {
  background-color: #f4e1e2 !important;
  border-color: #f4e1e2 !important;
  color: #cf0700 !important;
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

/*
Transitions to be used with Vue's <Transition> component
*/

//Transition name="fade"
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

//Transition name="slide-fade"
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

input::-ms-input-placeholder {
  color: black !important;
}

.ptap-widget {
  min-height: 315px;
}
</style>
