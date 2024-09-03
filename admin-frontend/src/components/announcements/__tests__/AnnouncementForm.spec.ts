import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AnnouncementForm from '../AnnouncementForm.vue';

global.ResizeObserver = require('resize-observer-polyfill');

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

describe('AnnouncementItem - Vue Test Utils tests', () => {
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
      global: {
        plugins: [vuetify, pinia],
      },
    });

    //wait for the async component to load
    await flushPromises();
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      vi.clearAllMocks();
      wrapper.unmount();
    }
  });

  describe('buildAnnouncementToPreview', () => {
    describe('when link and attachment details are provided', () => {
      it('builds an announcement with resources', async () => {
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
});
