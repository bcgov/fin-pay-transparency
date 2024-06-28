import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import App from '../App.vue';
import router from '../router';
import { authStore } from '../store/modules/auth';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

const setupComponentEnvironment = async (options: any = {}) => {
  const vuetify = createVuetify({
    components,
    directives,
  });

  const pinia = createTestingPinia({
    initialState: {
      code: {},
      config: {},
    },
  });

  const auth = authStore();
  auth.getJwtToken = vi.fn().mockResolvedValue(null);
  auth.doesUserHaveRole = vi.fn().mockReturnValue(true);

  const mockRouter = createRouter({
    history: createWebHistory(),
    routes: router.getRoutes(),
  });

  const wrapper = mount(
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
        plugins: [vuetify, pinia, mockRouter],
      },
    },
  );

  //wait for the async App component to load
  await flushPromises();

  const app = await wrapper.findComponent(App);

  return {
    wrapper: wrapper,
    pinia: pinia,
    app: app,
    router: mockRouter,
    auth: auth,
  };
};

describe('App', () => {
  beforeEach(async () => {});

  describe('if the header and sidebar are supposed to be visible', () => {
    it('they are both actually visible', async () => {
      const componentEnv = await setupComponentEnvironment();
      componentEnv.app.vm.areHeaderAndSidebarVisible = true;
      await componentEnv.app.vm.$nextTick();
      expect(componentEnv.app.find('header')).toBeTruthy();
      expect(componentEnv.app.find('SideBar')).toBeTruthy();
    });
  });
  describe('if the header and sidebar are supposed to be hidden', () => {
    it('they are both actually hidden', async () => {
      const componentEnv = await setupComponentEnvironment();
      componentEnv.app.vm.areHeaderAndSidebarVisible = false;
      await componentEnv.app.vm.$nextTick();
      expect(componentEnv.app.find('header').exists()).toBeFalsy();
      expect(componentEnv.app.find('SideBar').exists()).toBeFalsy();
    });
  });

  describe('when the route changes to /user-management, and the user has permission to view the breadbrumb trail', async () => {
    it('breadcrumb trail is visible', async () => {
      const componentEnv = await setupComponentEnvironment();
      componentEnv.auth.doesUserHaveRole.mockReturnValue(true);
      componentEnv.router.push('/user-management');
      await componentEnv.router.isReady();
      await componentEnv.app.vm.$nextTick();
      expect(componentEnv.app.vm.isBreadcrumbTrailVisible).toBeTruthy();
    });
  });
  describe("when the route changes to /user-management, and the user doesn't have permission to view the breadbrumb trail", async () => {
    it('breadcrumb trail is hidden', async () => {
      const componentEnv = await setupComponentEnvironment();
      componentEnv.auth.doesUserHaveRole.mockReturnValue(false);
      componentEnv.router.push('/user-management');
      await componentEnv.router.isReady();
      await componentEnv.app.vm.$nextTick();
      expect(componentEnv.app.vm.isBreadcrumbTrailVisible).toBeFalsy();
    });
  });
});
