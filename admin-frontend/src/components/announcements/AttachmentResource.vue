<template>
  <div class="root">
    <a @click="ApiService.downloadFile(id)">
      {{ name }}
    </a>
    <v-btn
      density="compact"
      icon="mdi-pencil"
      class="mr-2"
      aria-label="Edit file"
      @click="emits('onEdit')"
    ></v-btn>
    <v-btn
      density="compact"
      icon="mdi-delete-outline"
      aria-label="Delete file"
      @click="emits('onDelete')"
    ></v-btn>
  </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue';
import ApiService from '../../services/apiService';

interface AttachmentResourceProps {
  id: string;
  name: string;
}
const { id, name } = defineProps<AttachmentResourceProps>();

const emits = defineEmits(['onEdit', 'onDelete']);
</script>
<style scoped lang="scss">
.root {
  display: flex;
  align-items: center;
}
</style>
