import type { Blueprint } from 'vuetify'
import { VBtn } from 'vuetify/components';

/**
 * Shared aliases for the BC Gov Vuetify theme.
 *
 * These aliases give the design system a stable set of component names to use
 * across apps while still mapping to the underlying Vuetify implementation.
 * The default props here keep the theme consistent without forcing each app to
 * repeat the same configuration in every template.
 */

export const bcdsAliases = {
  VBtnPrimary: VBtn,
  VBtnSecondary: VBtn,
  VBtnTertiary: VBtn,
  VBtnLink: VBtn,
} satisfies Blueprint['aliases']


export const bcdsAliasDefaults = {
  VBtnPrimary: {
    color: 'primary',
    variant: 'flat',
    ripple: false,
  },
  VBtnSecondary: {
    variant: 'outlined',
    class: 'bg-surface',
    ripple: false,
  },
  VBtnTertiary: {
    variant: 'text',
    ripple: false,
  },
  VBtnLink: {
    variant: 'plain',
    color: 'bcds-text-link',
    ripple: false,
  },
} satisfies Blueprint['defaults']

