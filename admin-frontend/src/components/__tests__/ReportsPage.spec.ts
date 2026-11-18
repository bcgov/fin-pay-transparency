import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPlugins } from '../../test-utils/vuetify';
import { useReportSearchStore } from '../../store/modules/reportSearchStore';
import ReportsPage from '../ReportsPage.vue';

describe('ReportsPage', () => {
  let wrapper;
  let pinia;
  let reportSearchStore;

  const initWrapper = async () => {
    const plugins = createTestPlugins({
      piniaOptions: { initialState: {} },
    });
    pinia = plugins.pinia;
    wrapper = mount(ReportsPage, {
      global: {
        plugins: plugins.plugins,
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
