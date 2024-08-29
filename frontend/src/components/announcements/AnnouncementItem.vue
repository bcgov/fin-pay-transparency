<template>
  <div>
    <h3 class="mb-1">{{ announcement.title }}</h3>
    <p>{{ announcement.description }}</p>
    <div class="mt-2">
      <div
        v-for="(announcementResource, i) in announcement.announcement_resource"
        :key="i"
        class="px-0"
      >
        <a
          v-if="announcementResource.resource_type === 'LINK'"
          :href="sanitizeUrl(announcementResource.resource_url)"
          target="_blank"
          rel="noopener"
          >{{ announcementResource.display_name }}</a
        >
        <a
          v-if="announcementResource.resource_type === 'ATTACHMENT'"
          @click="downloadAnnouncementResource(announcementResource)"
          >{{ announcementResource.display_name }}</a
        >
      </div>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'AnnouncementItem',
};
</script>

<script setup lang="ts">
import { Announcement, AnnouncementResource } from '../../types/announcements';
import { sanitizeUrl } from '@braintree/sanitize-url';
import ApiService from '../../common/apiService';

const props = defineProps<{
  announcement: Announcement;
}>();

async function downloadAnnouncementResource(
  announcementResource: AnnouncementResource,
) {
  await ApiService.downloadFile(announcementResource.announcement_resource_id);
}
</script>
