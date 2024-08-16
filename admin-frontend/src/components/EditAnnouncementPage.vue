<template>
  <AnnouncementForm
    :announcement="announcement"
    title="Edit Announcement"
    @save="submit"
    :mode="AnnouncementFormMode.EDIT"
  ></AnnouncementForm>
</template>

<script lang="ts" setup>
import { onBeforeMount } from 'vue';
import { storeToRefs } from 'pinia';
import {
  AnnouncementFormValue,
  AnnouncementFormMode,
} from '../types/announcements';
import AnnouncementForm from './announcements/AnnouncementForm.vue';
import { NotificationService } from '../services/notificationService';
import { useAnnouncementSelectionStore } from '../store/modules/announcementSelectionStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const selectionStore = useAnnouncementSelectionStore();
const { announcement } = storeToRefs(selectionStore);

const submit = async (data: AnnouncementFormValue) => {
  try {
    await selectionStore.saveChanges(data);
    NotificationService.pushNotificationSuccess(
      'Announcement saved successfully',
    );
    router.push('/announcements');
  } catch (error) {
    console.error('Failed to save announcement', error);
    NotificationService.pushNotificationError('Failed to save announcement');
  }
};

onBeforeMount(() => {
  if (!announcement.value) {
    router.replace('/announcements');
  }
});
</script>
