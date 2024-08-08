<template v-if="announcement">
  <v-btn
    aria-label="Actions"
    density="compact"
    variant="plain"
    icon="mdi-dots-vertical"
    color="black"
    class="btn-actions"
  >
    <v-icon color="black"></v-icon>
    <v-menu activator="parent">
      <v-list>
        <v-list-item>
          <v-btn variant="text" prepend-icon="mdi-pencil">Edit</v-btn>
        </v-list-item>
        <v-list-item v-if="announcement.status == AnnouncementStatus.Draft">
          <v-btn variant="text" prepend-icon="mdi-publish">Publish</v-btn>
        </v-list-item>
        <v-list-item v-if="announcement.status == AnnouncementStatus.Published">
          <v-btn variant="text" prepend-icon="mdi-cancel">Unpublish</v-btn>
        </v-list-item>
        <v-list-item v-if="announcement.status != AnnouncementStatus.Deleted">
          <v-btn
            class="text-red"
            variant="text"
            prepend-icon="mdi-delete"
            @click="deleteAnnouncement(announcement.announcement_id)"
            :loading="isDeleting"
            :disabled="isDeleting"
            >Delete</v-btn
          >
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn>

  <!-- dialogs -->
  <ConfirmationDialog ref="confirmDialog"> </ConfirmationDialog>
</template>

<script lang="ts">
export default {
  name: 'AnnouncementActions',
  props: ['announcement'],
};
</script>

<script setup lang="ts">
import { AnnouncementStatus } from '../../types/announcements';
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import ApiService from '../../services/apiService';
import { useAnnouncementSearchStore } from '../../store/modules/announcementSearchStore';
import { ref } from 'vue';
import { NotificationService } from '../../services/notificationService';

const announcementSearchStore = useAnnouncementSearchStore();
const confirmDialog = ref<typeof ConfirmationDialog>();
const isDeleting = ref<boolean>(false);

async function deleteAnnouncement(announcementId: string) {
  const isConfirmed = await confirmDialog.value?.open(
    'Confirm Deletion',
    `Are you sure you want to delete the selected announcement?  This action cannot be undone.`,
    {
      titleBold: true,
      resolveText: `Confirm`,
    },
  );
  if (isConfirmed) {
    isDeleting.value = true;
    try {
      await ApiService.deleteAnnouncements([announcementId]);
      announcementSearchStore.repeatSearch();
      NotificationService.pushNotificationSuccess(
        `Announcement deleted successfully.`,
        '',
      );
    } catch (e) {
    } finally {
      isDeleting.value = false;
    }
  }
}
</script>
