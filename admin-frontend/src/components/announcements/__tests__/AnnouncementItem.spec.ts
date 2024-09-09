import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { Announcement } from '../../../types/announcements';
import { default as AnnouncementItem } from '../AnnouncementItem.vue';

const mockDraftAnnouncement: Announcement = {
  announcement_id: '24b9455e-154b-46ce-91c7-5ec4474ad6fd',
  title: 'Eum benigne',
  description: 'Consectetur adstringo calculus talis',
  created_date: '2024-08-06T18:56:35.825Z',
  updated_date: '2024-08-06T18:56:35.825Z',
  created_by: '7e53edd6-f50f-4002-be1a-06dc506c138a',
  updated_by: '7e53edd6-f50f-4002-be1a-06dc506c138a',
  active_on: '2024-07-30T18:56:35.825Z',
  expires_on: '2024-10-29T18:56:35.825Z',
  status: 'DRAFT',
  announcement_resource: [],
};

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockDownloadFile = vi.fn();
const mockSaveAs = vi.fn();

vi.mock('../../../services/apiService', () => ({
  default: {
    downloadFile: (...args) => mockDownloadFile(...args),
  },
}));
vi.mock('file-saver', () => ({
  saveAs: (...args) => mockSaveAs(...args),
}));

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

describe('AnnouncementItem', () => {
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
    wrapper = mount(AnnouncementItem, {
      props: {
        announcement: mockDraftAnnouncement,
      },
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

  describe('downloadAnnouncementResource', () => {
    describe('when the resource has an announcement_resource_id', () => {
      it('downloads the resource from the backend', async () => {
        const mockAnnouncementResource = {
          announcement_resource_id: '123',
        };
        await wrapper.vm.downloadAnnouncementResource(mockAnnouncementResource);
        expect(mockDownloadFile).toHaveBeenCalled();
        expect(mockSaveAs).not.toHaveBeenCalled();
      });
    });
    describe("when the resource doesn't have an announcement_resource_id, but it does have an announcement_resource_file", () => {
      it('downloads the resource from the frontend', async () => {
        const mockAnnouncementResource = {
          announcement_resource_file: 'mock file',
        };
        await wrapper.vm.downloadAnnouncementResource(mockAnnouncementResource);
        expect(mockDownloadFile).not.toHaveBeenCalled();
        expect(mockSaveAs).toHaveBeenCalled();
      });
    });
  });
});
