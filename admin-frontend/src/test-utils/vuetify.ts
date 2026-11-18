import { bcdsBlueprint } from '@bcgov/vuetify-theme';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import { render, type RenderOptions } from '@testing-library/vue';
import { VApp } from 'vuetify/components';

type TestVuetifyOptions = Parameters<typeof createVuetify>[0];

export const createTestVuetify = (options: TestVuetifyOptions = {}) =>
  createVuetify({
    components,
    directives,
    blueprint: bcdsBlueprint,
    ...options,
  });

/** Render component with Pinia and Vuetify plugins. */
export const renderWithPlugins = <Component>(
  component: Component,
  options: RenderOptions<Component> = {},
) =>
  render(component, {
    ...options,
    global: {
      plugins: [createTestingPinia(), createTestVuetify()],
      ...options.global,
    },
  });

/**
 * Render component within a VApp context, which is necessary when the component
 * or its descendants need layout context provided by VApp.
 *  (eg. If you encounter "Error: [Vuetify] Could not find injected layout")
 *  (or eg. v-app-bar, v-navigation-drawer, v-footer, v-main, or v-snackbar)*/
export const renderInVAppWithPlugins = <Component>(
  component: Component,
  options: RenderOptions<typeof VApp> = {},
) =>
  renderWithPlugins(VApp, {
    ...options,
    slots: { default: component },
  });
