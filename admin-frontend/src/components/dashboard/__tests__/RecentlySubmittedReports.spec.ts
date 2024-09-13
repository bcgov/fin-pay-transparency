import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ApiService from '../../../services/apiService';
import RecentlySubmittedReports from '../RecentlySubmittedReports.vue';

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

describe('RecentlySubmittedReports', () => {
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
    wrapper = mount(RecentlySubmittedReports, {
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

  describe('getRecentlySubmittedReports', () => {
    it('fetches reports from the backend', async () => {
      const getReportsSpy = vi
        .spyOn(ApiService, 'getReports')
        .mockResolvedValue({ reports: [], total: 0 });
      wrapper.vm.getRecentlySubmittedReports();
      const searchParams = getReportsSpy.mock.calls[0][3];
      expect(searchParams).toStrictEqual([
        {
          create_date: 'desc',
        },
      ]);
    });
  });
});
