<template>
  <v-navigation-drawer mobile-breakpoint="0" color="sidebar">
    <div class="d-flex flex-column justify-center mb-8">
      <h1 class="d-flex justify-center mb-4">Pay Transparency Admin Portal</h1>
      <img
        tabindex="-1"
        src="../assets/images/bc-gov-logo.svg"
        width="155"
        class="logo"
        alt="B.C. Government Logo"
      />
    </div>

    <v-list-item prepend-icon="mdi:home" link title="Dashboard"></v-list-item>
    <v-list-item link title="Reports"></v-list-item>
    <v-list-item link title="Announcements"></v-list-item>
    <v-list-item link title="User Management"></v-list-item>
    <v-list-item link title="Analytics"></v-list-item>
  </v-navigation-drawer>
</template>

<script></script>

<style lang="scss">
.v-navigation-drawer {
  padding: 64px 10px 10px 10px;
}
</style>
