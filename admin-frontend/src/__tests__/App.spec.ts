import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import App from '../App.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

describe('App', () => {
  let wrapper;
  let pinia;
  let app;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {
        code: {},
        config: {},
      },
    });

    wrapper = mount(
      {
        //SideBar depends on vuetify components, so it must be mounted within a v-layout.
        //It is also an async component because one of its dependencies (v-navigation-drawer)
        //is async, so it must be mounted with a Suspense component.  Some
        //additional info about using the Suspense component are in the vue-test-utils docs
        //here:
        //https://test-utils.vuejs.org/guide/advanced/async-suspense.html#Testing-asynchronous-setup
        template: '<Suspense><App/></Suspense>',
      },
      {
        props: {},
        global: {
          components: {
            App,
          },
          plugins: [vuetify, pinia],
        },
      },
    );

    //wait for the async App component to load
    await flushPromises();

    app = await wrapper.findComponent(App);
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('if the header and sidebar are supposed to be visible', () => {
    it('they are both actually visible', () => {
      app.vm.areHeaderAndSidebarVisible = true;
      expect(app.find('header')).toBeTruthy();
      expect(app.find('SideBar')).toBeTruthy();
    });
  });
  describe('if the header and sidebar are supposed to be hidden', () => {
    it('they are both actually hidden', () => {
      app.vm.areHeaderAndSidebarVisible = false;
      expect(app.find('header').exists()).toBeFalsy();
      expect(app.find('SideBar').exists()).toBeFalsy();
    });
  });
});
