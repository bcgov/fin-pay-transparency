import { flushPromises, mount } from '@vue/test-utils';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTestPlugins,
  renderWithPlugins,
} from '../../../test-utils/vuetify';
import { AnnouncementStatus } from '../../../types/announcements';
import { useAnnouncementSearchStore } from '../../../store/modules/announcementSearchStore';
import AnnouncementSearchFilters from '../AnnouncementSearchFilters.vue';

describe('AnnouncementSearchFilters', () => {
  let wrapper;
  let pinia;

  const initWrapper = async (options: any = {}) => {
    const plugins = createTestPlugins({
      piniaOptions: { initialState: {} },
    });
    pinia = plugins.pinia;
    wrapper = mount(AnnouncementSearchFilters, {
      global: {
        plugins: plugins.plugins,
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

  describe('initial render', () => {
    it('renders the primary controls and hides secondary filters', () => {
      expect(wrapper.text()).toContain('Search');
      expect(wrapper.text()).toContain('Reset');
      expect(wrapper.text()).toContain('Filter');
      expect(wrapper.find('.secondary-filters').exists()).toBe(false);
    });

    it('disables Reset when no filters are dirty', () => {
      const resetButton = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Reset');
      expect(resetButton?.attributes('disabled')).toBeDefined();
    });
  });

  describe('status select slots', () => {
    const openSecondaryFilters = async () => {
      const filterButton = wrapper
        .findAll('button')
        .find((button) => button.text().includes('Filter'));
      await filterButton?.trigger('click');
      await flushPromises();
    };

    it('renders status chips for the first three selections', async () => {
      await openSecondaryFilters();
      wrapper.vm.selectedStatuses = [
        AnnouncementStatus.Published,
        AnnouncementStatus.Draft,
        AnnouncementStatus.Expired,
        AnnouncementStatus.Archived,
      ];
      await flushPromises();

      expect(wrapper.find('.secondary-filters').text()).toContain(
        AnnouncementStatus.Published,
      );
      expect(wrapper.find('.secondary-filters').text()).toContain(
        AnnouncementStatus.Draft,
      );
      expect(wrapper.find('.secondary-filters').text()).toContain(
        AnnouncementStatus.Expired,
      );
      expect(wrapper.find('.secondary-filters').text()).toContain(
        '(+1 more)',
      );
      expect(wrapper.findAllComponents({ name: 'VChip' }).length).toBeGreaterThan(
        0,
      );
    });

    it('renders status options through the real Vuetify select', async () => {
      const plugins = createTestPlugins({
        piniaOptions: { initialState: {} },
      });
      const user = userEvent.setup();
      const rendered = renderWithPlugins(AnnouncementSearchFilters, {
        global: { plugins: plugins.plugins },
      });
      await flushPromises();

      await user.click(screen.getByText('Filter'));
      const select = await screen.findByPlaceholderText('All');
      await user.click(select);

      await waitFor(() => {
        expect(screen.getByText(AnnouncementStatus.Published)).toBeVisible();
        expect(screen.getByText(AnnouncementStatus.Draft)).toBeVisible();
        expect(screen.getByText(AnnouncementStatus.Expired)).toBeVisible();
      });
      expect(await screen.findAllByRole('option')).toHaveLength(3);
      rendered.unmount();
    });
  });

  describe('toggleSecondaryFiltersVisible', () => {
    it('shows and hides the secondary filters', async () => {
      const filterButton = wrapper
        .findAll('button')
        .find((button) => button.text().includes('Filter'));

      await filterButton?.trigger('click');
      await flushPromises();
      expect(wrapper.find('.secondary-filters').exists()).toBe(true);

      await filterButton?.trigger('click');
      await flushPromises();
      expect(wrapper.find('.secondary-filters').exists()).toBe(false);
    });

    it('can toggle the state directly', async () => {
      wrapper.vm.toggleSecondaryFiltersVisible();
      await flushPromises();
      expect(wrapper.find('.secondary-filters').exists()).toBe(true);

      wrapper.vm.toggleSecondaryFiltersVisible();
      await flushPromises();
      expect(wrapper.find('.secondary-filters').exists()).toBe(false);
    });
  });

  describe('isDirty', () => {
    it('returns false on initial state', () => {
      expect(wrapper.vm.isDirty()).toBe(false);
    });

    it('returns true for a non-empty search value', () => {
      wrapper.vm.searchText = 'Open call';
      expect(wrapper.vm.isDirty()).toBe(true);
    });

    it('returns false for a whitespace-only search value', () => {
      wrapper.vm.searchText = '   ';
      expect(wrapper.vm.isDirty()).toBe(false);
    });

    it('returns true while secondary filters are visible', () => {
      wrapper.vm.areSecondaryFiltersVisible = true;
      expect(wrapper.vm.isDirty()).toBe(true);
    });

    it('returns true for a secondary filter', () => {
      wrapper.vm.selectedStatuses = [AnnouncementStatus.Draft];
      expect(wrapper.vm.isDirty()).toBe(true);
    });
  });

  describe('areSecondaryFiltersDirty', () => {
    it('returns false on initial state', () => {
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(false);
    });

    it('returns true when the active date range is set', () => {
      wrapper.vm.publishDateRange = [new Date(), new Date()];
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });

    it('returns true when the expiry date range is set', () => {
      wrapper.vm.expiryDateRange = [new Date(), new Date()];
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });

    it('returns true when statuses are selected', () => {
      wrapper.vm.selectedStatuses = [AnnouncementStatus.Published];
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });
  });

  describe('clear', () => {
    it('resets all filter values and calls the store reset action', () => {
      wrapper.vm.searchText = 'Notice';
      wrapper.vm.publishDateRange = [new Date(), new Date()];
      wrapper.vm.expiryDateRange = [new Date(), new Date()];
      wrapper.vm.selectedStatuses = [AnnouncementStatus.Expired];

      wrapper.vm.clear();

      expect(wrapper.vm.searchText).toBeUndefined();
      expect(wrapper.vm.publishDateRange).toBeUndefined();
      expect(wrapper.vm.expiryDateRange).toBeUndefined();
      expect(wrapper.vm.selectedStatuses).toStrictEqual([]);

      const store = useAnnouncementSearchStore(pinia);
      expect(store.reset).toHaveBeenCalledOnce();
    });
  });

  describe('reset', () => {
    it('clears all filters and hides secondary filters', async () => {
      wrapper.vm.searchText = 'Notice';
      wrapper.vm.areSecondaryFiltersVisible = true;

      wrapper.vm.reset();
      await flushPromises();

      expect(wrapper.vm.searchText).toBeUndefined();
      expect(wrapper.find('.secondary-filters').exists()).toBe(false);
    });
  });

  describe('searchAnnouncements', () => {
    it('calls the store with the current filters', async () => {
      const store = useAnnouncementSearchStore(pinia);
      wrapper.vm.searchText = 'Annual update';

      await wrapper.vm.searchAnnouncements();

      expect(store.searchAnnouncements).toHaveBeenCalledWith({
        filter: expect.arrayContaining([
          expect.objectContaining({
            key: 'title',
            operation: 'like',
            value: 'Annual update',
          }),
        ]),
      });
    });

    it('delegates to the store when the Search button is clicked', async () => {
      const store = useAnnouncementSearchStore(pinia);
      const searchButton = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Search');

      await searchButton?.trigger('click');

      expect(store.searchAnnouncements).toHaveBeenCalledWith({
        filter: [],
      });
    });
  });

  describe('toApiDateTime', () => {
    it('sets the first date to the start of its day', () => {
      const value = wrapper.vm.toApiDateTime(
        new Date('2024-04-17T12:30:00Z'),
        0,
      );
      expect(value).toMatch(/T\d{2}:00:00Z$/);
    });

    it('sets the second date to the end of its day', () => {
      const value = wrapper.vm.toApiDateTime(
        new Date('2024-05-17T12:30:00Z'),
        1,
      );
      expect(value).toMatch(/T\d{2}:59:59\.\d{9}Z$/);
    });
  });

  describe('formatDate', () => {
    it('formats a date in the Canada locale', () => {
      expect(wrapper.vm.formatDate(new Date('2024-04-17T12:30:00Z'))).toContain(
        '2024',
      );
    });
  });

  describe('getAnnouncementSearchFilters', () => {
    describe(`when the title search is specified`, () => {
      it('produces a title like filter', () => {
        wrapper.vm.clear();
        wrapper.vm.searchText = 'Annual update';
        const filters = wrapper.vm.getAnnouncementSearchFilters();
        expect(filters).toContainEqual({
          key: 'title',
          operation: 'like',
          value: 'Annual update',
        });
      });

      it('does not include a title filter for an empty search', () => {
        wrapper.vm.clear();
        const filters = wrapper.vm.getAnnouncementSearchFilters();
        expect(filters.find((filter) => filter.key === 'title')).toBeUndefined();
      });
    });

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
        const publishDateFilters = filters.filter((d) => d.key == 'active_on');
        expect(publishDateFilters.length).toBe(1);
        expect(publishDateFilters[0].operation).toBe('between');
        expect(publishDateFilters[0].value.length).toBe(2);
      });

      it('sets the start and end timestamps to the boundaries of each day', () => {
        wrapper.vm.clear();
        wrapper.vm.publishDateRange = [
          new Date('2024-04-17T12:30:00Z'),
          new Date('2024-05-17T12:30:00Z'),
        ];
        const [start, end] = wrapper.vm
          .getAnnouncementSearchFilters()
          .find((filter) => filter.key === 'active_on').value;
        expect(start).toMatch(/T\d{2}:00:00Z$/);
        expect(end).toMatch(/T\d{2}:59:59\.\d{9}Z$/);
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

    describe(`when all filters are specified`, () => {
      it('includes title, active date, expiry date, and status filters', () => {
        wrapper.vm.searchText = 'Policy';
        wrapper.vm.publishDateRange = [
          new Date('2024-01-01T12:00:00Z'),
          new Date('2024-01-31T12:00:00Z'),
        ];
        wrapper.vm.expiryDateRange = [
          new Date('2024-02-01T12:00:00Z'),
          new Date('2024-02-29T12:00:00Z'),
        ];
        wrapper.vm.selectedStatuses = [
          AnnouncementStatus.Published,
          AnnouncementStatus.Draft,
        ];

        const filters = wrapper.vm.getAnnouncementSearchFilters();
        expect(filters.map((filter) => filter.key)).toEqual(
          expect.arrayContaining([
            'title',
            'active_on',
            'expires_on',
            'status',
          ]),
        );
      });
    });
  });
});
