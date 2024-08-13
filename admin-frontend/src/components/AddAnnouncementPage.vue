<template>
  <v-row dense class="mt-0 w-100 mb-4">
    <v-col class="py-0 px-0">
      <AnnouncementForm
        :announcement="null"
        title="Add Announcement"
        @save="submit"
      ></AnnouncementForm>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { AnnouncementFormValue } from '../types/announcements';
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
