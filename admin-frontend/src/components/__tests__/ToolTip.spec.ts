import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestVuetify } from '../../test-utils/vuetify';
import ToolTip from '../ToolTip.vue';



describe('ToolTip', () => {
  let wrapper;
  let pinia;

  const initWrapper = async () => {
    const vuetify = createTestVuetify();

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(ToolTip, {
      props: {
        text: 'Mock text',
      },
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

  it('Tooltip has an icon', async () => {
    const icon = wrapper.find('.fa-circle-info');
    expect(icon.exists()).toBeTruthy();
  });
});
