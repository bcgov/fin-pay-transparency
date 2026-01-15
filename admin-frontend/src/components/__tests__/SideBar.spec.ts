import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import SideBar from '../SideBar.vue';
import { createTestingPinia } from '@pinia/testing';

describe('SideBar', () => {
  let wrapper;
  let sidebar;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });
    const pinia = createTestingPinia({
      initialState: {},
    });

    wrapper = mount(
      {
        //SideBar depends on vuetify components, so it must be mounted within a v-layout.
        //It is also an async component because one of its dependencies (v-navigation-drawer)
        //is async, so it must be mounted with a Suspense component.  Some
        //additional info about using the Suspense component are in the vue-test-utils docs
        //here:
        //https://test-utils.vuejs.org/guide/advanced/async-suspense.html#Testing-asynchronous-setup
        template: '<v-layout><Suspense><SideBar/></Suspense></v-layout>',
      },
      {
        props: {},
        global: {
          components: {
            SideBar,
          },
          plugins: [vuetify, pinia],
        },
      },
    );

    //wait for the async SideBar component to load
    await flushPromises();

    sidebar = await wrapper.findComponent(SideBar);
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  //tests of functions

  describe('toggleIsExpanded', () => {
    describe('is currently expanded', () => {
      it('collapses the sidebar', () => {
        sidebar.vm.isExpanded = true;
        sidebar.vm.toggleIsExpanded();
        expect(sidebar.vm.isExpanded).toBeFalsy();
      });
    });
    describe('is currently collapsed', () => {
      it('expands the sidebar', () => {
        sidebar.vm.isExpanded = false;
        sidebar.vm.toggleIsExpanded();
        expect(sidebar.vm.isExpanded).toBeTruthy();
      });
    });
  });

  //tests of UI interactions

  describe('if the sidebar is expanded and the toggle button is clicked', () => {
    it('sidebar collapses', () => {
      sidebar.vm.isExpanded = true;
      const toggleBtn = sidebar.findComponent('#sidebar-rail-toggle-btn');
      toggleBtn.trigger('click');
      expect(sidebar.vm.isExpanded).toBeFalsy();
    });
  });
  describe('if the sidebar is expanded and the toggle button is clicked', () => {
    it('sidebar expands', () => {
      sidebar.vm.isExpanded = false;
      const toggleBtn = sidebar.findComponent('#sidebar-rail-toggle-btn');
      toggleBtn.trigger('click');
      expect(sidebar.vm.isExpanded).toBeTruthy();
    });
  });
});
