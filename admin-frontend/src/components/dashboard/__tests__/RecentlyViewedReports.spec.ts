import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ApiService from '../../../services/apiService';
import RecentlyViewedReports from '../RecentlyViewedReports.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('../../../services/apiService');

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

describe('RecentlyViewedReports', () => {
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
    wrapper = mount(RecentlyViewedReports, {
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

  describe('getRecentlyViewedReports', () => {
    it('fetches reports from the backend', async () => {
      const getReportsSpy = vi
        .spyOn(ApiService, 'getReports')
        .mockResolvedValue({ reports: [], total: 0 });
      wrapper.vm.getRecentlyViewedReports();
      const filterParams = getReportsSpy.mock.calls[0][2];
      const sortParams = getReportsSpy.mock.calls[0][3];
      expect(sortParams).toStrictEqual([
        {
          admin_last_access_date: 'desc',
        },
      ]);
      expect(filterParams).toStrictEqual([
        {
          key: 'admin_last_access_date',
          operation: 'not',
          value: null,
        },
        {
          key: 'report_status',
          operation: 'eq',
          value: 'Published',
        },
      ]);
    });
  });
});
