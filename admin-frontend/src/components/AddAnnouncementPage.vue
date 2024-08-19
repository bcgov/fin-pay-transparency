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
import { NotificationService } from '../services/notificationService';
import ApiService from '../services/apiService';

const router = useRouter();

const submit = async (data: AnnouncementFormValue) => {
  try {
    await ApiService.addAnnouncement(data);
    NotificationService.pushNotificationSuccess(
      'Announcement saved successfully',
    );
    router.push('/announcements');
  } catch (error) {
    console.error('Failed to save announcement', error);
    NotificationService.pushNotificationError('Failed to save announcement');
  }
};
</script>
