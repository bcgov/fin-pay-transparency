import { bcdsBlueprint } from '@bcgov/vuetify-theme';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import { render, type RenderOptions } from '@testing-library/vue';
import { setActivePinia, type Pinia } from 'pinia';
import type { Plugin } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { VApp } from 'vuetify/components';
import appRouter from '../router';

type TestVuetifyOptions = Parameters<typeof createVuetify>[0];

export const createTestVuetify = (options: TestVuetifyOptions = {}) =>
  createVuetify({
    components,
    directives,
    blueprint: bcdsBlueprint,
    ...options,
  });

type TestPluginsOptions = {
  pinia?: Pinia;
  piniaOptions?: Parameters<typeof createTestingPinia>[0];
  vuetify?: ReturnType<typeof createTestVuetify>;
  vuetifyOptions?: TestVuetifyOptions;
  router?: Router;
  plugins?: Plugin[];
};

/**
 * Create plugin instances for specs that need to access them directly, such as
 * creating a Pinia store before rendering. Pass the same plugins to the render
 * helper so the component and the spec share their state.
 *
 * @example
 * const testPlugins = createTestPlugins();
 * const auth = authStore();
 * renderWithPlugins(Header, { global: { plugins: testPlugins.plugins } });
 */
export const createTestPlugins = ({
  pinia: providedPinia,
  piniaOptions,
  vuetify: providedVuetify,
  vuetifyOptions,
  router: providedRouter,
  plugins: additionalPlugins = [],
}: TestPluginsOptions = {}) => {
  const pinia = providedPinia ?? createTestingPinia(piniaOptions);
  const vuetify = providedVuetify ?? createTestVuetify(vuetifyOptions);
  const router =
    providedRouter ??
    createRouter({
      history: createMemoryHistory(),
      routes: appRouter.getRoutes(),
    });
  setActivePinia(pinia);

  return {
    pinia,
    vuetify,
    router,
    plugins: [pinia, vuetify, router, ...additionalPlugins],
  };
};

/**
 * Render with fresh Pinia, Vuetify, and router plugins by default. Specs do not
 * need to call `createTestPlugins` unless they need direct access to those
 * instances. When `global.plugins` is provided, that list is used as-is.
 */
export const renderWithPlugins = <Component>(
  component: Component,
  options: RenderOptions<Component> = {},
) => {
  const plugins = options.global?.plugins ?? createTestPlugins().plugins;

  return render(component, {
    ...options,
    global: {
      ...options.global,
      plugins,
    },
  });
};

/**
 * Render component within a VApp context, which is necessary when the component
 * or its descendants need layout context provided by VApp.
 *  (eg. If you encounter "Error: [Vuetify] Could not find injected layout" which
 *  can be caused by v-app-bar, v-navigation-drawer, v-footer, v-main, or v-snackbar)*/
export const renderInVAppWithPlugins = <Component>(
  component: Component,
  options: RenderOptions<typeof VApp> = {},
) =>
  renderWithPlugins(VApp, {
    ...options,
    slots: { default: component },
  });
