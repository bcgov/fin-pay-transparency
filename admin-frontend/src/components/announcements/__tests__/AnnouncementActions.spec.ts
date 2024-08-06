import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ApiService from '../../../services/apiService';
import { IAnnouncement } from '../../../types/announcements';
import AnnouncementActions from '../AnnouncementActions.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

const mockDraftAnnouncement: IAnnouncement = {
  announcement_id: '24b9455e-154b-46ce-91c7-5ec4474ad6fd',
  title: 'Eum benigne',
  description: 'Consectetur adstringo calculus talis',
  created_date: '2024-08-06T18:56:35.825Z',
  updated_date: '2024-08-06T18:56:35.825Z',
  created_by: '7e53edd6-f50f-4002-be1a-06dc506c138a',
  updated_by: '7e53edd6-f50f-4002-be1a-06dc506c138a',
  published_on: '2024-07-30T18:56:35.825Z',
  expires_on: '2024-10-29T18:56:35.825Z',
  status: 'DRAFT',
};

describe('AnnouncementActions', () => {
  let wrapper;
  let pinia;

  const initWrapper = async () => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(AnnouncementActions, {
      props: {
        announcement: mockDraftAnnouncement,
      },
      global: {
        plugins: [vuetify, pinia],
      },
      stubs: {
        transition: true,
      },
    });

    //wait for the async component to load
    await flushPromises();
  };

  beforeEach(async () => {
    initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('deleteAnnouncement', async () => {
    it('delegates to the ApiService', async () => {
      const announcementId = '1';
      const apiSpy = vi
        .spyOn(ApiService, 'deleteAnnouncements')
        .mockResolvedValue();
      wrapper.vm.deleteAnnouncement(announcementId);
      expect(apiSpy).toHaveBeenCalledWith([announcementId]);
    });
  });
});
