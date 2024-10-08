import { defineStore } from 'pinia';
import { ref } from 'vue';
import ApiService from '../../services/apiService';
import { Announcement, AnnouncementFormValue } from '../../types/announcements';

export const useAnnouncementSelectionStore = defineStore(
  'announcementSelection',
  () => {
    const announcement = ref<AnnouncementFormValue | undefined>(undefined);

    const setAnnouncement = (
      data: Announcement & {
        announcement_resource: {
          resource_type: string;
          display_name: string;
          resource_url: string;
          attachment_file_id: string;
        }[];
      },
    ) => {
      const link = data.announcement_resource.find(
        (r) => r.resource_type === 'LINK',
      );
      const attachment = data.announcement_resource.find(
        (r) => r.resource_type === 'ATTACHMENT' && r.attachment_file_id,
      );

      announcement.value = {
        announcement_id: data.announcement_id,
        title: data.title,
        description: data.description,
        active_on: data.active_on,
        expires_on: data.expires_on,
        status: data.status,
        no_expiry: data.expires_on === null,
        linkUrl: link?.resource_url,
        linkDisplayName: link?.display_name,
        attachmentId: attachment?.attachment_file_id,
        fileDisplayName: attachment?.display_name,
        file_resource_id: attachment?.announcement_resource_id,
      };
    };

    const reset = () => {
      announcement.value = undefined;
    };

    const saveChanges = async (data: AnnouncementFormValue) => {
      if (announcement.value?.announcement_id) {
        await ApiService.updateAnnouncement(
          announcement.value.announcement_id,
          data,
        );
      }
    };

    return {
      announcement,
      setAnnouncement,
      reset,
      saveChanges,
    };
  },
);
