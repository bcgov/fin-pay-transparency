import { bcdsBlueprint } from '@bcgov/vuetify-theme';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import { render, type RenderOptions } from '@testing-library/vue';

type TestVuetifyOptions = Parameters<typeof createVuetify>[0];

export const createTestVuetify = (options: TestVuetifyOptions = {}) =>
  createVuetify({
    components,
    directives,
    blueprint: bcdsBlueprint,
    ...options,
  });

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
