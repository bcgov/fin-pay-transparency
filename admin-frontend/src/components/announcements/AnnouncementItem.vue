<template>
  <div>
    <h3 class="mb-1">{{ announcement.title }}</h3>
    <div
      v-if="announcement?.description"
      v-dompurify-html="announcement?.description"
      class="rich-text"
    ></div>
    <div class="mt-2">
      <div
        v-for="(announcementResource, i) in announcement.announcement_resource"
        :key="i"
        class="px-0"
      >
        <p v-if="announcementResource.resource_type === 'LINK'" class="mb-2">
          <a
            :href="sanitizeUrl(announcementResource.resource_url)"
            target="_blank"
            rel="noopener"
            >{{ announcementResource.display_name }}
            <v-icon
              icon="fa:fas fa-arrow-up-right-from-square"
              size=".85em"
              color="primary icon-align"
              class="icon-align"
            />
          </a>
        </p>
        <p
          v-if="announcementResource.resource_type === 'ATTACHMENT'"
          class="mb-2"
        >
          <v-icon
            icon="fa:fas fa-paperclip"
            size="x-small"
            color="primary"
            class="mr-1 icon-align"
          />
          <a @click="downloadAnnouncementResource(announcementResource)">{{
            announcementResource.display_name
          }}</a>
        </p>
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
import { NotificationService } from '../../services/notificationService';
import { FILE_DOWNLOAD_ERROR } from '../../constants';

defineProps<{
  announcement: Announcement;
}>();

async function downloadAnnouncementResource(
  announcementResource: AnnouncementResource,
) {
  if (announcementResource.announcement_resource_id) {
    try {
      await ApiService.downloadFile(
        announcementResource.announcement_resource_id,
      );
    } catch (error) {
      console.error(error);
      NotificationService.pushNotificationError(FILE_DOWNLOAD_ERROR, '', 30000);
    }
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
<style>
.icon-align {
  vertical-align: baseline;
}
</style>
