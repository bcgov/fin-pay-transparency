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
        >{{ announcementResource.display_name }}</a
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

const props = defineProps<{
  announcement: Announcement;
}>();
</script>
