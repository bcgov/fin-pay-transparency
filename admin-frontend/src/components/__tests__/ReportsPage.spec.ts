import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestVuetify } from '../../test-utils/vuetify';
import { useReportSearchStore } from '../../store/modules/reportSearchStore';
import ReportsPage from '../ReportsPage.vue';

describe('ReportsPage', () => {
  let wrapper;
  let pinia;
  let reportSearchStore;

  const initWrapper = async () => {
    const vuetify = createTestVuetify();

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
