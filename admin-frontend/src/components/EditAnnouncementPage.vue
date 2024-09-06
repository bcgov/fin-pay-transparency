<template>
  <AnnouncementForm
    :announcement="announcement"
    title="Edit Announcement"
    :mode="AnnouncementFormMode.EDIT"
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
import { onBeforeMount, onBeforeUnmount, ref } from 'vue';
import { storeToRefs } from 'pinia';
import {
  AnnouncementFormValue,
  AnnouncementFormMode,
} from '../types/announcements';
import Spinner from './Spinner.vue';
import AnnouncementForm from './announcements/AnnouncementForm.vue';
import { NotificationService } from '../services/notificationService';
import { useAnnouncementSelectionStore } from '../store/modules/announcementSelectionStore';
import { useAnnouncementSearchStore } from '../store/modules/announcementSearchStore';
import { useRouter } from 'vue-router';
const isProcessing = ref<boolean>(false);

const router = useRouter();
const selectionStore = useAnnouncementSelectionStore();
const announcementSearch = useAnnouncementSearchStore();
const { announcement } = storeToRefs(selectionStore);

const submit = async (data: AnnouncementFormValue) => {
  try {
    isProcessing.value = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await selectionStore.saveChanges(data);
    NotificationService.pushNotificationSuccess(
      'Announcement saved successfully',
    );
    await announcementSearch.repeatSearch();
    router.push('/announcements');
  } catch (error) {
    console.error('Failed to save announcement', error);
    NotificationService.pushNotificationError('Failed to save announcement');
  } finally {
    isProcessing.value = false;
  }
};

onBeforeMount(() => {
  if (!announcement.value) {
    router.replace('/announcements');
  }
});

onBeforeUnmount(() => {
  selectionStore.reset();
});
</script>
