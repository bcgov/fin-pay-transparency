<template>
  <AnnouncementForm
    :announcement="null"
    title="Add Announcement"
    @save="submit"
  ></AnnouncementForm>
</template>

<script lang="ts" setup>
import { Announcement } from '../types';
import AnnouncementForm from './announcements/announcement-form.vue';
import { NotificationService } from '../services/notificationService';
import ApiService from '../services/apiService';

const submit = async (data: Announcement) => {
  try {
    await ApiService.addAnnouncement(data);
    NotificationService.pushNotificationSuccess(
      'Announcement saved successfully',
    );
  } catch (error) {
    console.error('Failed to save announcement', error);
    NotificationService.pushNotificationError('Failed to save announcement');
  }
};
</script>
