import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import SideBar from '../SideBar.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

describe('SideBar', () => {
  let wrapper;
  let sidebar;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    const mockRoute = {
      name: 'dashboard',
    };
    const mockRouter = {
      push: vi.fn(),
    };

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '',
          component: {
            template: 'home',
          },
        },
        {
          path: '/',
          component: {
            template: 'home',
          },
        },
        {
          path: '/dashboard',
          component: {
            template: 'Dashboard placeholder',
          },
        },
        {
          path: '/analytics',
          component: {
            template: 'analytics',
          },
        },
        {
          path: '/user-management',
          component: {
            template: 'user-management',
          },
        },
        {
          path: '/announcements',
          component: {
            template: 'announcements',
          },
        },
        {
          path: '/reports',
          component: {
            template: 'reports',
          },
        },
      ],
    });

    wrapper = mount(
      {
        //SideBar depends on vuetify components, so it must be mounted within a v-layout.
        //It is also an async component (because one of its dependencies,v-navigation-drawer,
        //is async), so it must be mounted with a Suspense component.  Some
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
          plugins: [vuetify],
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
