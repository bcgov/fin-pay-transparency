<!--suppress ALL -->
<template>
  <v-container fluid class="d-flex justify-center fill-height w-85">
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

.w-85 {
  width: 85%;
}
</style>

