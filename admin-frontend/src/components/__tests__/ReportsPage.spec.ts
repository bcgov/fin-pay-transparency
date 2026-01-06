import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { useReportSearchStore } from '../../store/modules/reportSearchStore';
import ReportsPage from '../ReportsPage.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

describe('ReportsPage', () => {
  let wrapper;
  let pinia;
  let reportSearchStore;

  const initWrapper = async () => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(ReportsPage, {
      global: {
        plugins: [vuetify, pinia],
      },
    });
    reportSearchStore = useReportSearchStore();

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

  describe('exportResults', () => {
    it('delegates to reportSearchStore', async () => {
      const downloadReportsCsvSpy = vi
        .spyOn(reportSearchStore, 'downloadReportsCsv')
        .mockResolvedValue(null);
      wrapper.vm.lastSubmittedReportSearchParams = { filter: [] };
      wrapper.vm.exportResults();
      expect(downloadReportsCsvSpy).toHaveBeenCalledWith(
        wrapper.vm.lastSubmittedReportSearchParams,
      );
    });
  });
});
