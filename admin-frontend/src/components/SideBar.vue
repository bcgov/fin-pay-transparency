<template>
  <v-navigation-drawer mobile-breakpoint="0" color="sidebar">
    <div class="justify-center text-center">
      <img
        src="../assets/images/bc-gov-logo.svg"
        width="155"
        alt="B.C. Government Logo"
        class="mb-8"
      />
      <div class="d-flex justify-center mb-8 title">
        Pay Transparency Admin Portal
      </div>
    </div>
    <v-list-item
      link
      to="dashboard"
      title="Dashboard"
      :class="{ active: activeRoute == 'dashboard' }"
    >
      <template v-slot:prepend>
        <v-icon icon="mdi-home"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      link
      to="reports"
      title="Reports"
      :class="{ active: activeRoute == 'reports' }"
    >
      <template v-slot:prepend>
        <v-icon icon="mdi-magnify"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      link
      to="announcements"
      title="Announcements"
      :class="{ active: activeRoute == 'announcements' }"
    >
      <template v-slot:prepend>
        <v-icon icon="mdi-bullhorn"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      link
      to="user-management"
      title="User Management"
      :class="{ active: activeRoute == 'user-management' }"
    >
      <template v-slot:prepend>
        <v-icon icon="mdi-account-multiple"></v-icon>
      </template>
    </v-list-item>
    <v-list-item
      link
      to="analytics"
      title="Analytics"
      :class="{ active: activeRoute == 'analytics' }"
    >
      <template v-slot:prepend>
        <v-icon icon="mdi-chart-bar"></v-icon>
      </template>
    </v-list-item>
  </v-navigation-drawer>
</template>

<script setup>
import { watch, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeRoute = ref();

watch(
  route,
  () => {
    activeRoute.value = route.name;
  },
  { immediate: true },
);
</script>

<style lang="scss">
.v-navigation-drawer {
  padding: 64px 10px 10px 10px;
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
