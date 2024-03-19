<template>
  <div class="track-root d-flex align-center">
    <div class="track">
      <div class="slide"></div>
    </div>
  </div>
</template>
<script setup>
import Step from './Step.vue'
</script>
<style scoped lang="scss">
.track-root {
  position: relative;
  width: 100%;

  .track {
    width: 100%;
    height: 15px;
    background-color: lightgrey;
    border-radius: 5px;
    .slide {
      width: 50%;
      height: 15px;
      background-color: red;
      border-radius: 5px;
    }
  }
}
</style>
