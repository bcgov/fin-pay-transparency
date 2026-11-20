import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestPlugins } from '../../test-utils/vuetify';
import ToolTip from '../ToolTip.vue';

describe('ToolTip', () => {
  let wrapper;

  const initWrapper = async () => {
    const plugins = createTestPlugins({
      piniaOptions: { initialState: {} },
    });
    wrapper = mount(ToolTip, {
      props: {
        text: 'Mock text',
      },
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

  it('Tooltip has an icon', async () => {
    const icon = wrapper.find('.fa-circle-info');
    expect(icon.exists()).toBeTruthy();
  });
});
