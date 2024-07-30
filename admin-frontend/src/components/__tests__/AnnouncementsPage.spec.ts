import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { useAnnouncementSearchStore } from '../../store/modules/announcementSearchStore';
import { default as AnnouncementsPage } from '../AnnouncementsPage.vue';

const mockAnnouncements = [
  {
    announcement_id: '5e590182-10fd-4fff-bde3-ce31c7d7ac7f',
    title: 'Totidem ambitus.',
    description:
      'Coniuratio conicio adficio calculus asper velut cotidie suasoria coniuratio. Barba caterva tabula minus carcer excepturi vomer veritas templum utrimque. Ait voluptatibus thermae video xiphias.',
    created_date: '2024-07-25T22:53:59.483Z',
    updated_date: '2024-07-25T22:53:59.483Z',
    created_by: '9117a915-dab4-43db-851f-ee54b86cc2c0',
    updated_by: '9117a915-dab4-43db-851f-ee54b86cc2c0',
    published_on: '2024-07-25T19:12:25.005Z',
    expires_on: '2024-11-28T03:01:10.115Z',
    status: 'PUBLISHED',
  },
  {
    announcement_id: '9f7d619f-f996-4f89-81d5-46d1e515107d',
    title: 'Delibero voluptate.',
    description:
      'Ipsa attollo theatrum depromo defessus. Alioqui spero calculus thymbra tergo. Blandior cibo cariosus.',
    created_date: '2024-07-25T22:53:59.483Z',
    updated_date: '2024-07-25T22:53:59.483Z',
    created_by: '9117a915-dab4-43db-851f-ee54b86cc2c0',
    updated_by: '9117a915-dab4-43db-851f-ee54b86cc2c0',
    published_on: '2024-07-25T18:01:09.025Z',
    expires_on: '2024-11-02T00:33:11.342Z',
    status: 'DRAFT',
  },
];

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockGetAnnouncements = vi.fn();

vi.mock('../../services/apiService', () => ({
  default: {
    getAnnouncements: (...args) => mockGetAnnouncements(...args),
  },
}));

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

describe('AnnouncementsPage', () => {
  let wrapper;
  let pinia;
  let announcementSearchStore;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(AnnouncementsPage, {
      global: {
        plugins: [vuetify, pinia],
      },
    });
    announcementSearchStore = useAnnouncementSearchStore();

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

  it('has search results', async () => {
    expect(wrapper.findAll('.search-results').length).toBe(1);
    announcementSearchStore.searchResults = mockAnnouncements;
    await nextTick();
    expect(wrapper.html()).toContain(`Displaying ${mockAnnouncements.length}`);
  });

  it('has search filters', async () => {
    //await nextTick();
    //expect(wrapper.findComponent(AnnouncementsSearchFilters)).toBe(true);
  });
});
