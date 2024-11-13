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
import ApiService from '../../common/apiService';
import { NotificationService } from '../../common/notificationService';

defineProps<{
  announcement: Announcement;
}>();

async function downloadAnnouncementResource(
  announcementResource: AnnouncementResource,
) {
  try {
    await ApiService.downloadFile(
      announcementResource.announcement_resource_id,
    );
  } catch (error) {
    console.error(error);
    NotificationService.pushNotificationError(
      'There is a problem with this link/file, please try again later. If the problem persists please contact the Gender Equity Office; paytransparency@gov.bc.ca',
      '',
      30000,
    );
  }
}
</script>
