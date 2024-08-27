<template>
  <div>
    <h3 class="mb-1">{{ announcement.title }}</h3>
    <p>{{ announcement.description }}</p>
    <div
      v-for="(announcementResource, i) in announcement.announcement_resource"
      :key="i"
      class="px-0 mt-2"
    >
      <a
        :href="sanitizeUrl(announcementResource.resource_url)"
        target="_blank"
        rel="noopener"
        v-if="announcementResource.resource_type === 'LINK'"
        >{{ announcementResource.display_name }}</a
      >
      <v-btn
        variant="text"
        class="download-link"
        @click="
          ApiService.downloadFile(announcementResource.announcement_resource_id)
        "
        v-else
        >{{ announcementResource.display_name }}</v-btn
      >
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'AnnouncementItem',
};
</script>

<script setup lang="ts">
import { Announcement } from '../../types/announcements';
import { sanitizeUrl } from '@braintree/sanitize-url';
import ApiService from '../../common/apiService';

const props = defineProps<{
  announcement: Announcement;
}>();
</script>
<style scoped lang="scss">
.download-link {
  padding-left: 0;
  color: #255a90;
}
</style>
