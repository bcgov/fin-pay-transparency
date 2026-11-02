import { describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import { BCDS_THEME_NAME, bcdsBlueprint, bcdsTheme } from '../src/index.js';

describe('bcds blueprint', () => {
  it('registers the bcds theme and makes it the default', () => {
    const vuetify = createVuetify({ blueprint: bcdsBlueprint });
    expect(vuetify.theme.name.value).toBe(BCDS_THEME_NAME);
    expect(vuetify.theme.themes.value[BCDS_THEME_NAME].colors.primary).toBe(
      '#013366',
    );
  });

  it('applies component defaults', () => {
    const vuetify = createVuetify({ blueprint: bcdsBlueprint });
    expect(vuetify.defaults.value?.VBtn).toMatchObject({
      color: 'primary',
      variant: 'flat',
    });
  });

  it('lets app options override the blueprint', () => {
    const vuetify = createVuetify({
      blueprint: bcdsBlueprint,
      defaults: { VBtn: { variant: 'outlined' } },
      theme: {
        themes: { [BCDS_THEME_NAME]: { colors: { primary: '#000000' } } },
      },
    });
    expect(vuetify.defaults.value?.VBtn).toMatchObject({
      color: 'primary',
      variant: 'outlined',
    });
    expect(vuetify.theme.themes.value[BCDS_THEME_NAME].colors.primary).toBe(
      '#000000',
    );
    // untouched values survive the merge
    expect(vuetify.theme.themes.value[BCDS_THEME_NAME].colors.error).toBe(
      '#ce3e39',
    );
  });

  it('has no empty colour values', () => {
    for (const [name, value] of Object.entries(bcdsTheme.colors)) {
      expect(value, `colour "${name}"`).toMatch(
        /^(#[0-9a-f]{6}|rgba?\(.+\))$/i,
      );
    }
  });
});
