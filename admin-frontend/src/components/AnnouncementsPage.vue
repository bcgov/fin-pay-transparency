<template>
  <div class="search-results w-100">
    <v-row class="mt-0 w-100" no-gutters>
      <v-col sm="8" md="8" lg="6" xl="4" class="d-flex align-center"> </v-col>
      <v-col
        sm="4"
        md="4"
        lg="6"
        xl="8"
        class="d-flex justify-end align-center"
      >
        <v-btn class="btn-primary" @click="addAnnouncement()">
          Add announcement
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Announcements',
};
</script>

<script setup lang="ts">
async function addAnnouncement() {
  console.log('TODO: add announcement');
}
</script>

<style></style>
