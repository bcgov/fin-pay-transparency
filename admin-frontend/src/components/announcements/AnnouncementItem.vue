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
import ApiService from '../../services/apiService';
import { saveAs } from 'file-saver';

const props = defineProps<{
  announcement: Announcement;
}>();

async function downloadAnnouncementResource(
  announcementResource: AnnouncementResource,
) {
  if (announcementResource.announcement_resource_id) {
    await ApiService.downloadFile(
      announcementResource.announcement_resource_id,
    );
  } else if (announcementResource.announcement_resource_file) {
    //When a resource with type ATTACHMENT hasn't yet been uploaded to the
    //backend, it won't yet have an announcement_resource_id, so we
    //cannot offer a download in the standard way.  In this case,
    //check if the resource has the announcement_resource_file property, and
    //if so, download that. The announcement_resource_file property is
    //not known to the backend, but it is useful in the admin-frontend when
    //displaying not-yet-saved resources.
    await saveAs(announcementResource.announcement_resource_file);
  }
}
</script>
