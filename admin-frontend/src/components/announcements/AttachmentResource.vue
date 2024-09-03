<template>
  <div class="root">
    <v-btn
      variant="text"
      color="primary"
      append-icon="mdi-open-in-new"
      @click="ApiService.downloadFile(id)"
      >{{ name }}</v-btn
    >
    <v-btn
      density="compact"
      icon="mdi-pencil"
      class="mr-2"
      @click="emits('onEdit')"
      aria-label="Edit file"
    ></v-btn>
    <v-btn
      density="compact"
      icon="mdi-delete-outline"
      @click="emits('onDelete')"
      aria-label="Delete file"
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
