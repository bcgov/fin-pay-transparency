<template>
  <div class="root">
    <a :aria-label="name" @click="downloadFile(id)">
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
import ApiService from '../../services/apiService';
import { NotificationService } from '../../services/notificationService';
import { FILE_DOWNLOAD_ERROR } from '../../constants';

interface AttachmentResourceProps {
  id: string;
  name: string;
}
const { id, name } = defineProps<AttachmentResourceProps>();

const emits = defineEmits(['onEdit', 'onDelete']);

const downloadFile = async (id: string) => {
  try {
    await ApiService.downloadFile(id);
  } catch (error) {
    console.error(error);
    NotificationService.pushNotificationError(FILE_DOWNLOAD_ERROR, '', 30000);
  }
};
</script>
<style scoped lang="scss">
.root {
  display: flex;
  align-items: center;
}
</style>
