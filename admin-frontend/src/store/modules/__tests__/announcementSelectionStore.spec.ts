import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnnouncementSelectionStore } from '../announcementSelectionStore';

const mockUpdateAnnouncement = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    updateAnnouncement: () => mockUpdateAnnouncement(),
  },
}));

describe('announcementSelectionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('defaults', () => {
    it('should default announcement to undefined', () => {
      const store = useAnnouncementSelectionStore();
      expect(store.announcement).toBe(undefined);
    });
  });

  describe('actions', () => {
    describe('setAnnouncement', () => {
      it('should set announcement', () => {
        const store = useAnnouncementSelectionStore();
        const data = {
          announcement_id: '1',
          title: 'title',
          description: 'description',
          created_date: 'created_date',
          updated_date: 'updated_date',
          created_by: 'created_by',
          updated_by: 'updated_by',
          active_on: 'active_on',
          expires_on: 'expires_on',
          status: 'status',
          announcement_resource: [
            {
              resource_type: 'LINK',
              display_name: 'display_name',
              resource_url: 'resource_url',
            },
            {
              resource_type: 'ATTACHMENT',
              display_name: 'display_name',
              resource_url: 'resource_url',
              attachment_file_id: 'attachment_file_id',
            },
          ],
        };
        store.setAnnouncement(data as any);
        expect(store.announcement).toEqual(
          expect.objectContaining({
            title: 'title',
            announcement_id: '1',
            description: 'description',
            active_on: 'active_on',
            expires_on: 'expires_on',
            status: 'status',
            no_expiry: false,
            linkUrl: 'resource_url',
            linkDisplayName: 'display_name',
          }),
        );
      });
    });

    describe('reset', () => {
      it('should reset announcement', () => {
        const store = useAnnouncementSelectionStore();
        store.announcement = {
          announcement_id: '1',
          title: 'title',
          description: 'description',
          active_on: 'active_on',
          expires_on: 'expires_on',
          status: 'status',
          no_expiry: false,
          linkUrl: 'resource_url',
          linkDisplayName: 'display_name',
        };
        store.reset();
        expect(store.announcement).toBe(undefined);
      });
    });

    describe('saveChanges', () => {
      it('should save changes', async () => {
        const store = useAnnouncementSelectionStore();
        store.announcement = {
          announcement_id: '1',
          title: 'title',
          description: 'description',
          active_on: 'active_on',
          expires_on: 'expires_on',
          status: 'status',
          no_expiry: false,
          linkUrl: 'resource_url',
          linkDisplayName: 'display_name',
        };
        await store.saveChanges({
          title: 'new title',
          description: 'new description',
          active_on: 'new active_on',
          expires_on: 'new expires_on',
          status: 'new status',
          no_expiry: true,
          linkUrl: 'new resource_url',
          linkDisplayName: 'new display_name',
        });
        expect(mockUpdateAnnouncement).toHaveBeenCalled();
      });
    });
  });
});
