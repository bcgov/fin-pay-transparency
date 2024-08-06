import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { AnnouncementStatus } from '../../../types/announcements';
import AnnouncementSearchFilters from '../AnnouncementSearchFilters.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

describe('AnnouncementSearchFilters', () => {
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
    wrapper = mount(AnnouncementSearchFilters, {
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
      wrapper.unmount();
    }
  });

  describe('getAnnouncementSearchFilters', () => {
    describe(`after 'clear' is called`, () => {
      it('produces an empty filters array', async () => {
        wrapper.vm.clear();
        const filters = wrapper.vm.getAnnouncementSearchFilters();
        expect(filters).toStrictEqual([]);
      });
    });
    describe(`when the published date range is specified (and all other filters in the UI are empty)`, () => {
      it('produces a valid filters array', async () => {
        wrapper.vm.clear();
        const d1 = '2024-04-17T00:00:00Z';
        const d2 = '2024-05-17T00:00:00Z';
        const dateRange = [new Date(d1), new Date(d2)];
        wrapper.vm.publishDateRange = dateRange;
        const filters = wrapper.vm.getAnnouncementSearchFilters();
        const publishDateFilters = filters.filter(
          (d) => d.key == 'published_on',
        );
        expect(publishDateFilters.length).toBe(1);
        expect(publishDateFilters[0].operation).toBe('between');
        expect(publishDateFilters[0].value.length).toBe(2);
      });
    });
    describe(`when the expiry date range is specified (and all other filters in the UI are empty)`, () => {
      it('produces a valid filters array', async () => {
        wrapper.vm.clear();
        const d1 = '2024-04-17T00:00:00Z';
        const d2 = '2024-05-17T00:00:00Z';
        const dateRange = [new Date(d1), new Date(d2)];
        wrapper.vm.expiryDateRange = dateRange;
        const filters = wrapper.vm.getAnnouncementSearchFilters();
        const expiryDateFilters = filters.filter((d) => d.key == 'expires_on');
        expect(expiryDateFilters.length).toBe(1);
        expect(expiryDateFilters[0].operation).toBe('between');
        expect(expiryDateFilters[0].value.length).toBe(2);
      });
    });

    describe(`when the status is specified (and all other filters in the UI are empty)`, () => {
      it('produces a valid filters array', async () => {
        wrapper.vm.clear();
        const twoStatuses = [
          AnnouncementStatus.Published,
          AnnouncementStatus.Expired,
        ];
        wrapper.vm.selectedStatuses = twoStatuses;
        const filters = wrapper.vm.getAnnouncementSearchFilters();
        const statusFilters = filters.filter((d) => d.key == 'status');
        expect(statusFilters.length).toBe(1);
        expect(statusFilters[0].operation).toBe('in');
        expect(statusFilters[0].value).toStrictEqual(twoStatuses);
      });
    });
  });
});
