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
          <v-btn
            variant="text"
            prepend-icon="mdi-pencil"
            @click="editAnnouncement"
            >Edit</v-btn
          >
        </v-list-item>
        <v-list-item v-if="announcement.status == AnnouncementStatus.Published">
          <v-btn
            variant="text"
            prepend-icon="mdi-cancel"
            @click="unpublishAnnouncement(announcement.announcement_id)"
            >Unpublish</v-btn
          >
        </v-list-item>
        <v-list-item v-if="announcement.status != AnnouncementStatus.Deleted">
          <v-btn
            class="text-red"
            variant="text"
            prepend-icon="mdi-archive"
            @click="archiveAnnouncement(announcement.announcement_id)"
            :loading="isArchiving"
            :disabled="isArchiving"
            >Archive</v-btn
          >
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn>

  <!-- dialogs -->
  <ConfirmationDialog ref="confirmDialog"> </ConfirmationDialog>
</template>
<script setup lang="ts">
import { AnnouncementStatus } from '../../types/announcements';
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import ApiService from '../../services/apiService';
import { useAnnouncementSearchStore } from '../../store/modules/announcementSearchStore';
import { useAnnouncementSelectionStore } from '../../store/modules/announcementSelectionStore';
import { ref } from 'vue';
import { NotificationService } from '../../services/notificationService';
import { useRouter } from 'vue-router';

const router = useRouter();

const announcementSelectionStore = useAnnouncementSelectionStore();
const { announcement } = defineProps<{
  announcement: any;
}>();

const announcementSearchStore = useAnnouncementSearchStore();
const confirmDialog = ref<typeof ConfirmationDialog>();
const isArchiving = ref<boolean>(false);
const isUnpublishing = ref<boolean>(false);

async function archiveAnnouncement(announcementId: string) {
  const isConfirmed = await confirmDialog.value?.open(
    'Confirm Archive',
    `Are you sure you want to archive the selected announcement?  This action cannot be undone.`,
    {
      titleBold: true,
      resolveText: `Confirm`,
    },
  );
  if (isConfirmed) {
    isArchiving.value = true;
    try {
      await ApiService.deleteAnnouncements([announcementId]);
      announcementSearchStore.repeatSearch();
      NotificationService.pushNotificationSuccess(
        `Announcement archived successfully.`,
        '',
      );
    } catch (e) {
    } finally {
      isArchiving.value = false;
    }
  }
}

async function unpublishAnnouncement(announcementId: string) {
  const isConfirmed = await confirmDialog.value?.open(
    'Confirm Unpublish',
    `Unpublishing an announcement will return it to the ${AnnouncementStatus.Draft} status, making it unavailable to the public. Are you sure you want to continue? `,
    {
      titleBold: true,
      resolveText: `Confirm`,
    },
  );
  if (isConfirmed) {
    isUnpublishing.value = true;
    try {
      await ApiService.unpublishAnnouncement(announcementId);
      announcementSearchStore.repeatSearch();
      NotificationService.pushNotificationSuccess(
        `Announcement unpublished successfully.`,
        '',
      );
    } catch (e) {
    } finally {
      isUnpublishing.value = false;
    }
  }
}

const editAnnouncement = () => {
  announcementSelectionStore.setAnnouncement(announcement);
  router.push('/edit-announcement');
};
</script>
