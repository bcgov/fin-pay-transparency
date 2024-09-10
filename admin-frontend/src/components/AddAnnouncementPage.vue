<template>
  <AnnouncementForm
    :announcement="null"
    title="Add Announcement"
    :mode="AnnouncementFormMode.CREATE"
    @save="submit"
  ></AnnouncementForm>
  <v-overlay
    :persistent="true"
    :model-value="isProcessing"
    class="align-center justify-center"
  >
    <spinner />
  </v-overlay>
</template>

<script lang="ts" setup>
import Spinner from './Spinner.vue';
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
import { ref } from 'vue';

const router = useRouter();
const selectionStore = useAnnouncementSelectionStore();
const announcementSearch = useAnnouncementSearchStore();
const isProcessing = ref<boolean>(false);

const submit = async (data: AnnouncementFormValue) => {
  try {
    isProcessing.value = true;
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
  } finally {
    isProcessing.value = false;
  }
};
</script>
