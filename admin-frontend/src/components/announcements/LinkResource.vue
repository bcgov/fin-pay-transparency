<template>
  <div class="root">
    <v-btn
      variant="text"
      color="primary"
      append-icon="mdi-open-in-new"
      :href="sanitizeUrl(props.url)"
      target="_blank"
      >{{ props.text }}</v-btn
    >
    <v-btn
      density="compact"
      icon="mdi-pencil"
      class="mr-2"
      aria-label="Edit link"
      @click="emits('onEdit')"
    ></v-btn>
    <v-btn
      density="compact"
      icon="mdi-delete-outline"
      aria-label="Delete link"
      @click="emits('onDelete')"
    ></v-btn>
  </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue';
import { sanitizeUrl } from '@braintree/sanitize-url';


type LinkResourceProps = {
  text: string;
  url: string;
};

const props = defineProps<LinkResourceProps>();
const emits = defineEmits(['onEdit', 'onDelete']);
</script>
<style scoped></style>
