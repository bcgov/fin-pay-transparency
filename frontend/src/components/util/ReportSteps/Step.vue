<template>
  <div class="step-root d-flex flex-column align-center">
    <!-- <div class="index-label d-flex justify-center flex-column">
      {{ index + 1 }}
    </div> -->
    <div class="step-thumb"></div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps(['value', 'label', 'url', 'index', 'disabled']);
</script>
<style scoped lang="scss">
.step-root {
  .step-thumb {
    width: 30px;
    height: 30px;
    background-color: #fff;
    border: #003366 8px solid;
    border-radius: 15px;
  }

  
}
</style>
