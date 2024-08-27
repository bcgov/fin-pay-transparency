<template>
  <AnnouncementForm
    :announcement="null"
    title="Add Announcement"
    @save="submit"
    :mode="AnnouncementFormMode.CREATE"
  ></AnnouncementForm>
</template>

<script lang="ts" setup>
import {
  AnnouncementFormValue,
  AnnouncementFormMode,
} from '../types/announcements';
import { useRouter } from 'vue-router';
import AnnouncementForm from './announcements/AnnouncementForm.vue';
import { useAnnouncementSelectionStore } from '../store/modules/announcementSelectionStore';
import { useAnnouncementSearchStore } from '../store/modules/announcementSearchStore';
import { NotificationService } from '../services/notificationService';
import ApiService from '../services/apiService';

const router = useRouter();
const selectionStore = useAnnouncementSelectionStore();
const announcementSearch = useAnnouncementSearchStore();

const submit = async (data: AnnouncementFormValue) => {
  try {
    await ApiService.addAnnouncement(data);
    NotificationService.pushNotificationSuccess(
      'Announcement saved successfully',
    );
    selectionStore.reset();
    await announcementSearch.repeatSearch();
    router.push('/announcements');
  } catch (error) {
    console.error('Failed to save announcement', error);
    NotificationService.pushNotificationError('Failed to save announcement');
  }
};
</script>
