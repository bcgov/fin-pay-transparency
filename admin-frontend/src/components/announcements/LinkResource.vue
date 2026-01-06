<template>
  <div class="root">
    <a
      :href="sanitizeUrl(props.url)"
      target="_blank"
      rel="noopener"
      class="mr-2"
    >
      {{ props.text }}
    </a>
    <v-btn
      density="compact"
      icon="mdi-pencil"
      class="mr-2"
      aria-label="Edit link"
      @click="emits('onEdit')"
    />
    <v-btn
      density="compact"
      icon="mdi-delete-outline"
      aria-label="Delete link"
      @click="emits('onDelete')"
    />
  </div>
</template>
<script setup lang="ts">
import { sanitizeUrl } from '@braintree/sanitize-url';

type LinkResourceProps = {
  text: string;
  url: string;
};

const props = defineProps<LinkResourceProps>();
const emits = defineEmits(['onEdit', 'onDelete']);
</script>
