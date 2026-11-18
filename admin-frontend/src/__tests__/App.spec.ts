import { waitFor } from '@testing-library/vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPlugins } from '../test-utils/vuetify';
import App from '../App.vue';
import { authStore } from '../store/modules/auth';

vi.mock('../services/apiService');
const mockDoesUserHaveRole = vi.fn();
let pinia;
let mockRouter;
let plugins;

const setupComponentEnvironment = async () => {
  const auth = authStore();
  auth.getJwtToken = vi.fn().mockResolvedValue(null);
  auth.doesUserHaveRole = () => mockDoesUserHaveRole();

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
        plugins: plugins.plugins,
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
  beforeEach(async () => {
    vi.clearAllMocks();
    plugins = createTestPlugins({
      piniaOptions: {
        initialState: {
          code: {},
          config: {},
        },
      },
    });
    pinia = plugins.pinia;
    mockRouter = plugins.router;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
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
      mockDoesUserHaveRole.mockReturnValueOnce(true);
      componentEnv.router.push('/user-management');
      await componentEnv.router.isReady();
      await componentEnv.app.vm.$nextTick();
      await waitFor(() => {
        expect(componentEnv.app.vm.isBreadcrumbTrailVisible).toBeTruthy();
      });
    });
  });
  describe("when the route changes to /user-management, and the user doesn't have permission to view the breadbrumb trail", async () => {
    it('breadcrumb trail is hidden', async () => {
      const componentEnv = await setupComponentEnvironment();
      mockDoesUserHaveRole.mockReturnValueOnce(false);
      componentEnv.router.push('/user-management');
      await componentEnv.router.isReady();
      await componentEnv.app.vm.$nextTick();
      await waitFor(() => {
        expect(componentEnv.app.vm.isBreadcrumbTrailVisible).toBeFalsy();
      });
    });
  });
  describe('onRouteChanged', () => {
    describe('when the route changes', () => {
      it('various state variables are updated', async () => {
        const componentEnv = await setupComponentEnvironment();
        const to = {
          meta: {
            requiresAuth: false,
            breadcrumbs: ['dashboard'],
            pageTitle: 'sample route',
          },
        };
        mockDoesUserHaveRole.mockReturnValueOnce(false);
        componentEnv.app.vm.onRouteChanged(to, null);
        expect(componentEnv.app.vm.areHeaderAndSidebarVisible).toBe(
          to.meta.requiresAuth,
        );
        expect(componentEnv.app.vm.isBreadcrumbTrailVisible).toBe(false);
      });
    });
  });
});
