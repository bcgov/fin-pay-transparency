import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import {
  AnnouncementFormMode,
  AnnouncementStatus,
} from '../../../types/announcements';
import AnnouncementForm from '../AnnouncementForm.vue';

const mockGetAnnouncements = vi.fn().mockResolvedValue({ items: [] });
const mockClamavScan = vi.fn();

vi.mock('../../../services/apiService', () => ({
  default: {
    getAnnouncements: (...args) => {
      return mockGetAnnouncements(...args);
    },
    clamavScanFile: (...args) => {
      return mockClamavScan(...args);
    },
  },
}));

describe('AnnouncementForm - Vue Test Utils tests', () => {
  let wrapper;
  let pinia;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(AnnouncementForm, {
      ...options,
      global: {
        plugins: [vuetify, pinia],
      },
    });

    //wait for the async component to load
    await flushPromises();
  };

  afterEach(() => {
    if (wrapper) {
      vi.clearAllMocks();
      wrapper.unmount();
    }
  });

  describe('buildAnnouncementToPreview', () => {
    describe('when link and attachment details are provided', () => {
      it('builds an announcement with resources', async () => {
        await initWrapper();
        wrapper.vm.announcementTitle = 'title';
        wrapper.vm.announcementDescription = 'desc';
        wrapper.vm.linkDisplayName = 'link name';
        wrapper.vm.linkUrl = 'url';
        wrapper.vm.attachment = 'attachment';
        wrapper.vm.fileDisplayName = 'file display name';
        const announcement = wrapper.vm.buildAnnouncementToPreview();
        expect(
          announcement.announcement_resource.find(
            (r) => r.resource_type == 'LINK',
          ),
        ).toBeTruthy();
        expect(
          announcement.announcement_resource.find(
            (r) => r.resource_type == 'ATTACHMENT',
          ),
        ).toBeTruthy();
      });
    });
  });

  describe('Link Url', () => {
    it('should display the length and max length even if it is too long', async () => {
      await initWrapper();
      const longUrl = 'http://' + 'x'.repeat(255);
      const test = wrapper.findComponent({ ref: 'linkUrlRef' });
      await test.setValue(longUrl);
      expect(test.html()).toContain('>262/255<');
    });
  });

  describe('Edit an expired announcement', () => {
    describe('When the announcement is expired', async () => {
      it('Should set the default "Save As" status to "DRAFT"', async () => {
        await initWrapper({
          props: {
            announcement: {
              title: 'My announcement',
              description: 'Description here',
              active_on: '2024-11-25T19:46:56.000Z',
              expires_on: '2024-11-25T19:46:57.000Z',
              status: AnnouncementStatus.Expired as string,
              announcement_id: 'dfs543sdf4r56',
              no_expiry: true,
            },
            title: 'Title',
            mode: AnnouncementFormMode.EDIT,
          },
        });
        expect(wrapper.vm.status).toBe(AnnouncementStatus.Draft);
      });
    });
  });
});
