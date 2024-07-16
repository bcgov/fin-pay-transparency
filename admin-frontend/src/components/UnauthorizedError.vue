<template>
  <AuthLayout>
    <template #content>
      <v-container fluid class="root">
        <h1 class="title">Unauthorized</h1>
        <v-alert variant="outlined" class="alert-error mt-2 mb-2">
          You do not have authorization to access the Admin Portal. If you
          require access please contact the
          <a class="contact-email" href="mailto:paytransparency@gov.bc.ca">
            Gender Equity Office</a
          >.
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
  max-width: 500px;
  height: 100%;
}
</style>
