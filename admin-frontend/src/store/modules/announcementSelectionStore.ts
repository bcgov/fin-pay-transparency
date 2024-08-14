import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  AnnouncementFormValue,
  IAnnouncement,
} from '../../types/announcements';
import ApiService from '../../services/apiService';

export const useAnnouncementSelectionStore = defineStore(
  'announcementSelection',
  () => {
    const announcement = ref<
      (AnnouncementFormValue & { id: string }) | undefined
    >(undefined);

    const setAnnouncement = (
      data: IAnnouncement & {
        announcement_resource: {
          resource_type: string;
          display_name: string;
          resource_url: string;
        }[];
      },
    ) => {
      const link = data.announcement_resource.find(
        (r) => r.resource_type === 'LINK',
      );
      announcement.value = {
        id: data.announcement_id,
        title: data.title,
        description: data.description,
        published_on: data.published_on
          ? (new Date(data.published_on) as any)
          : undefined,
        expires_on: data.expires_on
          ? (new Date(data.expires_on) as any)
          : undefined,
        status: data.status,
        no_expiry: data.expires_on === null,
        linkUrl: link?.resource_url,
        linkDisplayName: link?.display_name,
      };
    };

    const reset = () => {
      announcement.value = undefined;
    };

    const saveChanges = async (data: AnnouncementFormValue) => {
      await ApiService.updateAnnouncement(announcement.value!.id, data);
    };

    return {
      announcement,
      setAnnouncement,
      reset,
      saveChanges,
    };
  },
);
