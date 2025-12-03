import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import EmployersPage from '../EmployersPage.vue';
import ApiService from '../../services/apiService';
import { NotificationService } from '../../services/notificationService';
import { waitFor } from '@testing-library/vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub global objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

// Mock the ApiService
vi.mock('../../services/apiService');

// Mock the NotificationService
vi.mock('../../services/notificationService');

describe('EmployersPage', () => {
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
    wrapper = mount(EmployersPage, {
      global: {
        plugins: [vuetify, pinia],
        stubs: {
          transition: true,
        },
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
      try {
        wrapper.unmount();
      } catch {
        // Ignore Vue unmount errors from stubs
      }
    }
    vi.clearAllMocks();
  });

  describe('component initialization', () => {
    it('renders the component', async () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('initializes with correct default values', async () => {
      expect(wrapper.vm.searchText).toBeUndefined();
      expect(wrapper.vm.selectedYears).toEqual([]);
      expect(wrapper.vm.dateRange).toBeUndefined();
      expect(wrapper.vm.pageSize).toBe(25);
      expect(wrapper.vm.isSearching).toBe(false);
      expect(wrapper.vm.hasSearched).toBe(false);
      expect(wrapper.vm.searchResults).toEqual([]);
      expect(wrapper.vm.totalNum).toBe(0);
    });

    it('generates year options from firstSearchableYear to currentYear', async () => {
      const currentYear = new Date().getFullYear();
      const expectedYears = [2024, 2025];
      if (currentYear > 2025) {
        for (let i = 2026; i <= currentYear; i++) {
          expectedYears.push(i);
        }
      }
      expect(wrapper.vm.yearOptions).toEqual(expectedYears);
    });

    it('has correct page size options', async () => {
      expect(wrapper.vm.pageSizeOptions).toEqual([10, 25, 50]);
    });

    it('initializes headers with correct properties', async () => {
      expect(wrapper.vm.headers).toHaveLength(2);
      expect(wrapper.vm.headers[0].key).toBe('company_name');
      expect(wrapper.vm.headers[0].title).toBe('Employer Name');
      expect(wrapper.vm.headers[1].key).toBe('create_date');
      expect(wrapper.vm.headers[1].title).toBe('Date of First Log In');
    });
  });

  describe('isDirty computed property', () => {
    it('returns truthy when hasSearched is true', async () => {
      wrapper.vm.hasSearched = true;
      expect(wrapper.vm.isDirty).toBeTruthy();
    });

    it('returns truthy when searchText is set', async () => {
      wrapper.vm.searchText = 'test employer';
      expect(wrapper.vm.isDirty).toBeTruthy();
    });

    it('returns truthy when selectedYears has items', async () => {
      wrapper.vm.selectedYears = [2024];
      expect(wrapper.vm.isDirty).toBeTruthy();
    });

    it('returns truthy when dateRange is set', async () => {
      const d1 = '2024-04-17T00:00:00Z';
      const d2 = '2024-05-17T00:00:00Z';
      wrapper.vm.dateRange = [new Date(d1), new Date(d2)];
      expect(wrapper.vm.isDirty).toBeTruthy();
    });

    it('returns falsy when all filters are empty and hasSearched is false', async () => {
      wrapper.vm.hasSearched = false;
      wrapper.vm.searchText = undefined;
      wrapper.vm.selectedYears = [];
      wrapper.vm.dateRange = undefined;
      expect(wrapper.vm.isDirty).toBeFalsy();
    });
  });

  describe('reset', () => {
    it('clears all filter values', async () => {
      wrapper.vm.searchText = 'test';
      wrapper.vm.selectedYears = [2024];
      wrapper.vm.dateRange = [new Date(), new Date()];
      wrapper.vm.hasSearched = true;

      wrapper.vm.reset();

      expect(wrapper.vm.searchText).toBeUndefined();
      expect(wrapper.vm.selectedYears).toEqual([]);
      expect(wrapper.vm.dateRange).toBeUndefined();
      expect(wrapper.vm.hasSearched).toBe(false);
    });

    it('resets pagination and results', async () => {
      wrapper.vm.pageSize = 50;
      wrapper.vm.searchResults = [
        { company_name: 'Test Co', create_date: '2024-01-01' },
      ];
      wrapper.vm.totalNum = 1;

      wrapper.vm.reset();

      expect(wrapper.vm.pageSize).toBe(25);
      expect(wrapper.vm.searchResults).toEqual([]);
      expect(wrapper.vm.totalNum).toBe(0);
    });
  });

  describe('buildSearchFilters', () => {
    it('returns empty filters array when no filters are set', async () => {
      const filters = wrapper.vm.buildSearchFilters();
      expect(filters).toEqual([]);
    });

    it('includes name filter when searchText is set', async () => {
      wrapper.vm.searchText = 'test employer';
      const filters = wrapper.vm.buildSearchFilters();
      const nameFilters = filters.filter((d) => d.key === 'company_name');

      expect(nameFilters.length).toBe(1);
      expect(nameFilters[0].operation).toBe('like');
      expect(nameFilters[0].value).toBe('test employer');
    });

    it('includes year filter when selectedYears is set', async () => {
      wrapper.vm.selectedYears = [2024, 2025];
      const filters = wrapper.vm.buildSearchFilters();
      const yearFilters = filters.filter((d) => d.key === 'create_year');

      expect(yearFilters.length).toBe(1);
      expect(yearFilters[0].operation).toBe('in');
      expect(yearFilters[0].value).toEqual([2024, 2025]);
    });

    it('includes date range filter when dateRange is set', async () => {
      const d1 = '2024-04-17T00:00:00Z';
      const d2 = '2024-05-17T00:00:00Z';
      const dateRange = [new Date(d1), new Date(d2)];
      wrapper.vm.dateRange = dateRange;

      const filters = wrapper.vm.buildSearchFilters();
      const dateFilters = filters.filter((d) => d.key === 'create_date');

      expect(dateFilters.length).toBe(1);
      expect(dateFilters[0].operation).toBe('between');
      expect(dateFilters[0].value).toHaveLength(2);
      // Verify that the dates are formatted as ISO_DATE_TIME
      expect(typeof dateFilters[0].value[0]).toBe('string');
      expect(typeof dateFilters[0].value[1]).toBe('string');
    });

    it('adjusts start date to 00:00:00', async () => {
      const d1 = '2024-04-17T15:30:45Z';
      wrapper.vm.dateRange = [new Date(d1), new Date()];

      const filters = wrapper.vm.buildSearchFilters();
      const dateFilters = filters.filter((d) => d.key === 'create_date');
      const startDateString = dateFilters[0].value[0];

      // Check that the time part is 00:00:00
      expect(startDateString).toContain('T00:00:00');
    });

    it('adjusts end date to 23:59:59', async () => {
      const d2 = '2024-05-17T10:30:00Z';
      wrapper.vm.dateRange = [new Date(), new Date(d2)];

      const filters = wrapper.vm.buildSearchFilters();
      const dateFilters = filters.filter((d) => d.key === 'create_date');
      const endDateString = dateFilters[0].value[1];

      // Check that the time part is 23:59:59
      expect(endDateString).toContain('T23:59:59');
    });

    it('includes multiple filters when all are set', async () => {
      wrapper.vm.searchText = 'employer';
      wrapper.vm.selectedYears = [2024];
      wrapper.vm.dateRange = [new Date('2024-04-17'), new Date('2024-05-17')];

      const filters = wrapper.vm.buildSearchFilters();

      expect(filters.length).toBe(3);
      expect(filters.some((f) => f.key === 'company_name')).toBe(true);
      expect(filters.some((f) => f.key === 'create_year')).toBe(true);
      expect(filters.some((f) => f.key === 'create_date')).toBe(true);
    });
  });

  describe('buildSort', () => {
    it('returns undefined when sortOptions is undefined', async () => {
      const sort = wrapper.vm.buildSort(undefined);
      expect(sort).toBeUndefined();
    });

    it('returns undefined when sortOptions is null', async () => {
      const sort = wrapper.vm.buildSort(null);
      expect(sort).toBeUndefined();
    });

    it('maps sortOptions to correct format', async () => {
      const sortOptions = [
        { key: 'company_name', order: 'asc' },
        { key: 'create_date', order: 'desc' },
      ];
      const sort = wrapper.vm.buildSort(sortOptions);

      expect(sort).toHaveLength(2);
      expect(sort[0]).toEqual({ field: 'company_name', order: 'asc' });
      expect(sort[1]).toEqual({ field: 'create_date', order: 'desc' });
    });

    it('handles single sort option', async () => {
      const sortOptions = [{ key: 'company_name', order: 'asc' }];
      const sort = wrapper.vm.buildSort(sortOptions);

      expect(sort).toHaveLength(1);
      expect(sort[0]).toEqual({ field: 'company_name', order: 'asc' });
    });
  });

  describe('search', () => {
    beforeEach(() => {
      vi.spyOn(ApiService, 'getEmployers').mockResolvedValue({
        employers: [
          {
            company_id: '1',
            company_name: 'Test Corp',
            create_date: '2024-01-15T00:00:00Z',
          },
        ],
        total: 1,
        totalPages: 1,
        offset: 0,
        limit: 25,
      });
    });

    it('calls ApiService.getEmployers with correct parameters', async () => {
      wrapper.vm.searchText = 'test';
      await wrapper.vm.search();

      expect(ApiService.getEmployers).toHaveBeenCalledWith(
        0,
        25,
        expect.any(Array),
        undefined,
      );
    });

    it('sets isSearching to true during search and false after', async () => {
      wrapper.vm.searchText = 'test';

      // Mock implementation to simulate a delay in the API response
      vi.mocked(ApiService.getEmployers).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  employers: [
                    {
                      company_id: '1',
                      company_name: 'Test Corp',
                      create_date: '2024-01-15T00:00:00Z',
                    },
                  ],
                  total: 1,
                  totalPages: 1,
                  offset: 0,
                  limit: 25,
                }),
              1000, // 1 second delay
            ),
          ),
      );

      expect(wrapper.vm.isSearching).toBe(false);

      //isSearching should become 'true' during the 1 second simulated delay
      const searchingTruePromise = waitFor(() =>
        expect(wrapper.vm.isSearching).toBe(true),
      );
      await wrapper.vm.search();
      await searchingTruePromise;

      //isSearching will be 'false' after search completes
      expect(wrapper.vm.isSearching).toBe(false);
    });

    it('sets hasSearched to true after search completes', async () => {
      expect(wrapper.vm.hasSearched).toBe(false);

      await wrapper.vm.search();
      expect(wrapper.vm.hasSearched).toBe(true);
    });

    it('updates searchResults with API response', async () => {
      const mockEmployers = [
        {
          company_id: '1',
          company_name: 'Tech Corp',
          create_date: '2024-01-15T00:00:00Z',
        },
        {
          company_id: '2',
          company_name: 'Finance Inc',
          create_date: '2024-02-20T00:00:00Z',
        },
      ];
      vi.spyOn(ApiService, 'getEmployers').mockResolvedValue({
        employers: mockEmployers,
        total: 2,
        totalPages: 1,
        offset: 0,
        limit: 25,
      });

      await wrapper.vm.search();

      expect(wrapper.vm.searchResults).toEqual(mockEmployers);
      expect(wrapper.vm.totalNum).toBe(2);
    });

    it('handles pagination options', async () => {
      const options = {
        page: 2,
        itemsPerPage: 10,
        sortBy: [{ key: 'company_name', order: 'asc' }],
      };

      await wrapper.vm.search(options);

      expect(ApiService.getEmployers).toHaveBeenCalledWith(
        10, // (page - 1) * itemsPerPage = (2 - 1) * 10 = 10
        25, // pageSize is still 25
        expect.any(Array),
        expect.any(Array),
      );
    });

    it('shows error notification on API failure', async () => {
      const mockError = new Error('API Error');
      vi.spyOn(ApiService, 'getEmployers').mockRejectedValue(mockError);
      vi.spyOn(NotificationService, 'pushNotificationError');

      await wrapper.vm.search();

      expect(NotificationService.pushNotificationError).toHaveBeenCalledWith(
        'Unable to search employers',
      );
    });

    it('still sets hasSearched to true after error', async () => {
      vi.spyOn(ApiService, 'getEmployers').mockRejectedValue(
        new Error('API Error'),
      );

      await wrapper.vm.search();
      await flushPromises();

      expect(wrapper.vm.hasSearched).toBe(true);
      expect(wrapper.vm.isSearching).toBe(false);
    });

    it('calculates correct offset with different page numbers', async () => {
      const options = { page: 3, itemsPerPage: 50 };
      await wrapper.vm.search(options);

      expect(ApiService.getEmployers).toHaveBeenCalledWith(
        100, // (3 - 1) * 50 = 100
        25,
        expect.any(Array),
        undefined,
      );
    });

    it('uses default offset of 0 when no options provided', async () => {
      await wrapper.vm.search();

      expect(ApiService.getEmployers).toHaveBeenCalledWith(
        0,
        25,
        expect.any(Array),
        undefined,
      );
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      vi.spyOn(ApiService, 'getEmployers').mockResolvedValue({
        employers: [
          {
            company_id: '1',
            company_name: 'Tech Corp',
            create_date: '2024-01-15T00:00:00Z',
          },
          {
            company_id: '2',
            company_name: 'Finance Inc',
            create_date: '2024-02-20T00:00:00Z',
          },
        ],
        total: 2,
        totalPages: 1,
        offset: 0,
        limit: 25,
      });
    });

    it('performs search with text filter', async () => {
      wrapper.vm.searchText = 'Tech';
      await wrapper.vm.search();

      expect(wrapper.vm.searchResults).toHaveLength(2);
      expect(wrapper.vm.totalNum).toBe(2);
      expect(wrapper.vm.hasSearched).toBe(true);
    });

    it('performs search with year filter', async () => {
      wrapper.vm.selectedYears = [2024];
      await wrapper.vm.search();

      const filters = wrapper.vm.buildSearchFilters();
      expect(filters.some((f) => f.key === 'create_year')).toBe(true);
    });

    it('resets page size when reset is called', async () => {
      wrapper.vm.pageSize = 50;
      wrapper.vm.searchText = 'test';
      wrapper.vm.selectedYears = [2024];

      wrapper.vm.reset();

      expect(wrapper.vm.pageSize).toBe(25);
      expect(wrapper.vm.searchText).toBeUndefined();
      expect(wrapper.vm.selectedYears).toEqual([]);
    });

    it('maintains pagination state across searches', async () => {
      wrapper.vm.pageSize = 10;
      await wrapper.vm.search({ page: 2, itemsPerPage: 10 });

      expect(wrapper.vm.pageSize).toBe(10);
    });

    it('clears results when reset is called', async () => {
      await wrapper.vm.search();
      expect(wrapper.vm.searchResults).toBeDefined();

      wrapper.vm.reset();

      expect(wrapper.vm.searchResults).toEqual([]);
      expect(wrapper.vm.totalNum).toBe(0);
    });
  });

  describe('empty search state', () => {
    it('searches with empty filters when no filters are set', async () => {
      vi.spyOn(ApiService, 'getEmployers').mockResolvedValue({
        employers: [],
        total: 0,
        totalPages: 0,
        offset: 0,
        limit: 25,
      });

      await wrapper.vm.search();

      expect(ApiService.getEmployers).toHaveBeenCalled();
      const calls = vi.mocked(ApiService.getEmployers).mock.calls;
      const callArgs = calls[calls.length - 1];
      expect(callArgs?.[2]).toEqual([]); // empty filters array
    });

    it('returns 0 results message when search returns no employers', async () => {
      vi.spyOn(ApiService, 'getEmployers').mockResolvedValue({
        employers: [],
        total: 0,
        totalPages: 0,
        offset: 0,
        limit: 25,
      });

      await wrapper.vm.search();

      expect(wrapper.vm.searchResults).toEqual([]);
      expect(wrapper.vm.totalNum).toBe(0);
    });
  });
});
