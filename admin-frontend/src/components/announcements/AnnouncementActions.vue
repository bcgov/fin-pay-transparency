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
</template>

<script lang="ts">
export default {
  name: 'AnnouncementActions',
  props: ['announcement'],
};
</script>

<script setup lang="ts">
import { AnnouncementStatus } from '../../types/announcements';
import ApiService from '../../services/apiService';
import { useAnnouncementSearchStore } from '../../store/modules/announcementSearchStore';
import { ref } from 'vue';

const announcementSearchStore = useAnnouncementSearchStore();
const isDeleting = ref<boolean>(false);

async function deleteAnnouncement(announcementId: string) {
  isDeleting.value = true;
  try {
    await ApiService.deleteAnnouncements([announcementId]);
    announcementSearchStore.repeatSearch();
  } catch (e) {
  } finally {
    isDeleting.value = false;
  }
}
</script>
