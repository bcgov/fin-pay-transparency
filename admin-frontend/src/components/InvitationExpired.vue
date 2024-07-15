<template>
  <AuthLayout>
    <template #content>
      <v-container fluid class="root">
        <h1 class="title">Invitation Expired</h1>
        <v-alert dense variant="outlined" class="alert-error mt-2 mb-2">
          <p>
            You are seeing this error page because the invitation link expires
            72 hours after creation. <br />Please contact an Admin Portal
            Manager to re-send an invitation link.<br />
            Thank you
          </p>
        </v-alert>
        <div></div>
      </v-container>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from './util/AuthLayout.vue';
</script>
<style scoped lang="scss">
.root {
  display: flex;
  flex-direction: column;
  max-width: 550px;
  height: 100%;
}
</style>
