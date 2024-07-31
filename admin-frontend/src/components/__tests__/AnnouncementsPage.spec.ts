import { faker } from '@faker-js/faker';
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

  // tests of UI state

  it('has search results', async () => {
    expect(wrapper.findAll('.search-results').length).toBe(1);
    announcementSearchStore.searchResults = mockAnnouncements;
    await nextTick();
    expect(wrapper.html()).toContain(`Displaying ${mockAnnouncements.length}`);
  });

  // tests of computed properties

  describe('selectedAnnouncementIds', () => {
    describe('when two announcements are selected', () => {
      it('property value is a list with the IDs of both selected announcements', async () => {
        mockAnnouncements.forEach((announcement) => {
          wrapper.vm.selectAnnouncement(announcement);
        });
        const result = wrapper.vm.selectedAnnouncementIds;
        expect(result).toStrictEqual(
          mockAnnouncements.map((a) => a.announcement_id),
        );
      });
    });
  });

  // tests of functions

  describe('showAnnouncement', () => {
    describe('value is an announcement', () => {
      it('shows the dialog', async () => {
        const mockAnnouncement = {};
        wrapper.vm.showAnnouncement(mockAnnouncement);
        expect(wrapper.vm.isAnnouncementDialogVisible).toBeTruthy();
      });
    });
    describe('value is undefined', () => {
      it('hides the dialog', async () => {
        const mockAnnouncement = undefined;
        wrapper.vm.showAnnouncement(mockAnnouncement);
        expect(wrapper.vm.isAnnouncementDialogVisible).toBeFalsy();
      });
    });
  });

  describe('selectAnnouncement', () => {
    describe('select = true', () => {
      it('adds the announcement ID as a key in the selectedAnnouncements object', async () => {
        const mockAnnouncement = {
          announcement_id: faker.string.uuid(),
        };
        wrapper.vm.selectedAnnouncements = {};
        wrapper.vm.selectAnnouncement(mockAnnouncement, true);
        expect(
          wrapper.vm.selectedAnnouncements[mockAnnouncement.announcement_id],
        ).toBeTruthy();
      });
    });
    describe('select = false', () => {
      it('adds the announcement ID as a key in the selectedAnnouncements object', async () => {
        const mockAnnouncement = {
          announcement_id: faker.string.uuid(),
        };
        wrapper.vm.selectedAnnouncements = {};
        wrapper.vm.selectAnnouncement(mockAnnouncement, false);
        expect(
          wrapper.vm.selectedAnnouncements.hasOwnProperty(
            mockAnnouncement.announcement_id,
          ),
        ).toBeFalsy();
      });
    });

    describe('toggleSelectAllAnnouncements', () => {
      describe('select = true', () => {
        it('selects all announcements', () => {
          wrapper.vm.selectedAnnouncements = {};
          wrapper.vm.searchResults = mockAnnouncements;
          wrapper.vm.toggleSelectAllAnnouncements(true);
          expect(wrapper.vm.selectedAnnouncements).toStrictEqual(
            Object.fromEntries(
              mockAnnouncements.map((a) => [a.announcement_id, true]),
            ),
          );
        });
      });
      describe('select = false', () => {
        it('deselects all announcements', () => {
          wrapper.vm.selectedAnnouncements = { mock_annoncement_id: true };
          wrapper.vm.searchResults = mockAnnouncements;
          wrapper.vm.toggleSelectAllAnnouncements(false);
          expect(wrapper.vm.selectedAnnouncements).toStrictEqual({});
        });
      });
    });
  });

  describe('clearSelectionOfNonSearchResults', () => {
    describe("where there is one selected announcement and it isn't in the search results", () => {
      it('deselects all announcements', () => {
        wrapper.vm.selectedAnnouncements = { mock_annoncement_id: true };
        wrapper.vm.searchResults = mockAnnouncements;
        wrapper.vm.clearSelectionOfNonSearchResults();
        expect(wrapper.vm.selectedAnnouncements).toStrictEqual({});
      });
    });
    describe('where there is one selected announcement and it is in the search results', () => {
      it('no change to the selected announcement', () => {
        const initialSelection = Object.fromEntries([
          [mockAnnouncements[0].announcement_id, true],
        ]);
        wrapper.vm.searchResults = mockAnnouncements;
        wrapper.vm.selectedAnnouncements = initialSelection;
        wrapper.vm.clearSelectionOfNonSearchResults();
        expect(wrapper.vm.selectedAnnouncements).toStrictEqual(
          initialSelection,
        );
      });
    });
  });
});
