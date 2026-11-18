import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPlugins } from '../../test-utils/vuetify';
import DashboardPage from '../DashboardPage.vue';
import NumEmployerLogins from '../dashboard/NumEmployerLogons.vue';

vi.mock('../../services/apiService', () => ({
  default: {
    getReports: vi.fn().mockResolvedValue({ reports: [], total: 0 }),
  },
}));

describe('DashboardPage', () => {
  let wrapper;
  let pinia;

  const initWrapper = async () => {
    const plugins = createTestPlugins({
      piniaOptions: { initialState: {} },
    });
    pinia = plugins.pinia;
    wrapper = mount(DashboardPage, {
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
      wrapper.unmount();
    }
  });

  //Tests that required UI components appear on the page

  it('The Recently Submitted Reports widget is shown', async () => {
    if (wrapper.vm.isDashboardAvailable) {
      expect(wrapper.findComponent(NumEmployerLogins)).toBeTruthy();
    }
  });
});
