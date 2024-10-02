<template>
  <v-navigation-drawer
    mobile-breakpoint="0"
    color="sidebar"
    :rail="!isExpanded"
    rail-width="75"
    permanent
  >
    <div class="d-flex justify-end mb-6">
      <v-btn
        id="sidebar-rail-toggle-btn"
        :aria-label="isExpanded ? 'Collapse menu' : 'Expand menu'"
        :icon="isExpanded ? 'mdi-chevron-left' : 'mdi-chevron-right'"
        variant="text"
        @click.stop="toggleIsExpanded()"
      ></v-btn>
    </div>
    <div class="justify-center text-center">
      <img
        src="../assets/images/bc-gov-logo.svg"
        :width="isExpanded ? 155 : 138"
        alt="B.C. Government Logo"
        class="mb-8"
      />
      <div v-if="isExpanded" class="d-flex justify-center mb-8 text-h6">
        Pay Transparency Admin Portal
      </div>
    </div>
    <v-list-item
      v-if="auth.doesUserHaveRole(USER_ROLE_NAME)"
      link
      to="dashboard"
      title="Dashboard"
      :class="{ active: activeRoute == 'dashboard' }"
    >
      <template #prepend>
        <v-icon icon="mdi-home"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      v-if="auth.doesUserHaveRole(USER_ROLE_NAME)"
      link
      to="reports"
      title="Search Reports"
      :class="{ active: activeRoute == 'reports' }"
    >
      <template #prepend>
        <v-icon icon="mdi-magnify"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      v-if="auth.doesUserHaveRole(USER_ROLE_NAME)"
      link
      to="analytics"
      title="Analytics"
      :class="{ active: activeRoute == 'analytics' }"
    >
      <template #prepend>
        <v-icon icon="mdi-chart-bar"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      v-if="auth.doesUserHaveRole(ADMIN_ROLE_NAME)"
      link
      to="user-management"
      title="User Management"
      :class="{ active: activeRoute == 'user-management' }"
    >
      <template #prepend>
        <v-icon icon="mdi-account-multiple"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      v-if="auth.doesUserHaveRole(USER_ROLE_NAME)"
      link
      to="announcements"
      title="Announcements"
      :class="{ active: activeRoute == 'announcements' }"
    >
      <template #prepend>
        <v-icon icon="mdi-bullhorn"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      v-if="auth.doesUserHaveRole(USER_ROLE_NAME)"
      link
      to="employers"
      title="Employer Search"
      :class="{ active: activeRoute == 'employers' }"
    >
      <template #prepend>
        <v-icon icon="mdi-office-building"></v-icon>
      </template>
    </v-list-item>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: 'SideBar',
  suspensible: false,
};
</script>

<script setup>
import { watch, ref } from 'vue';
import { useRoute } from 'vue-router';
import { authStore } from '../store/modules/auth';
import { ADMIN_ROLE_NAME, USER_ROLE_NAME } from '../constants';

const auth = authStore();
const route = useRoute();
const activeRoute = ref();
const isExpanded = ref(true);

const toggleIsExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

watch(
  () => route?.name,
  (newVal, oldVal) => {
    activeRoute.value = newVal;
  },
  { immediate: true },
);
</script>

<style lang="scss">
.v-navigation-drawer {
  padding: 10px;
}
.title {
  font-size: 1.5em;
  font-weight: bold;
  line-height: 1.3em;
}
.v-list-item__spacer {
  width: 16px !important;
}
.active {
  background-color: #ffffff11 !important;
}
</style>
