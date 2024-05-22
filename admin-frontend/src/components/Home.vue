<!--suppress ALL -->
<template>
  <v-container class="d-flex justify-center fill-height">
    <dashboard></dashboard>
  </v-container>
</template>

<script>

import Dashboard from './Dashboard.vue';

export default {
  name: 'Home',
  components: { Dashboard },
  data() {
    return {};
  },
  computed: {},
  mounted() {
  },
  methods: {}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.top-banner {
  background-size: cover;
  align-items: center;
  display: flex;
}

.tile-size {
  height: 100%;
  width: 100%;
}

.card-size {
  height: 12em;
  width: 62em;
}

.margin-initial {
  margin: initial;
}
</style>

