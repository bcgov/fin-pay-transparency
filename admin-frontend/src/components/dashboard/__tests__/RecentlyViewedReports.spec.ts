import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPlugins } from '../../../test-utils/vuetify';
import ApiService from '../../../services/apiService';
import RecentlyViewedReports from '../RecentlyViewedReports.vue';

vi.mock('../../../services/apiService');

describe('RecentlyViewedReports', () => {
  let wrapper;

  const initWrapper = async () => {
    const plugins = createTestPlugins({
      piniaOptions: { initialState: {} },
    });
    wrapper = mount(RecentlyViewedReports, {
      global: {
        plugins: plugins.plugins,
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
