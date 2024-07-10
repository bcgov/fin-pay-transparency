<template>
  <AuthLayout>
    <template #content>
      <v-container fluid class="root">
        <h1 class="title">Invitation Expired</h1>
        <v-alert dense variant="outlined" class="alert-error mt-2 mb-2">
          The invitation link to access the Pay Transparency Portal has expired. Please contact the Pay Transparency
          Office to request a new invitation.
        </v-alert>
        <div>
      </div>
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
  max-width: 500px;
  height: 100%;
}
</style>
