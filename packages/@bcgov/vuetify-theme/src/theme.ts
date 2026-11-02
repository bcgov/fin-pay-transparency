import type { ThemeDefinition } from 'vuetify'
import * as t from '@bcgov/design-tokens/js'

/** Name the theme is registered under in `createVuetify`. */
export const BCDS_THEME_NAME = 'bcds'

/**
 * B.C. Design System (light) theme for Vuetify.
 *
 * This is a CURATED mapping, not a dump of every token. Only values Vuetify's
 * theme can consume belong here (colours, plus a few `variables`). Spacing,
 * typography, shadows etc. stay as CSS variables from
 * `@bcgov/design-tokens/css/variables.css`.
 *
 * Every value is imported from the token package, so a renamed or removed
 * token becomes a TypeScript error on upgrade instead of a silent gap.
 *
 * Entries marked DECISION are design calls that need sign-off, because BCDS
 * and Vuetify don't use the same vocabulary.
 */
export const bcdsTheme = {
  dark: false,
  colors: {
    // --- Vuetify core palette -------------------------------------------
    // DECISION: Vuetify's two colours, `primary` and `secondary`, can be thought of as quick/easy-access colours for components.
    // Vuetify styles everything in 'primary' by default, which makes t.surfaceColorPrimaryDefault a good choice.
    // BCSD doesn't have a 'secondary' quick/easy-access colour, so use the BCDS gold as a secondary accent.
    primary: t.surfaceColorPrimaryDefault,
    secondary: t.themePrimaryGold,

    background: t.surfaceColorBackgroundWhite,
    surface: t.surfaceColorBackgroundWhite,
    // Vuetify uses surface-variant as its dark/inverse surface (tooltips draw on it).
    'surface-variant': t.themeGray110,

    // Status colours use the BCDS "support" border colours (the saturated ones).
    error: t.supportBorderColorDanger,
    success: t.supportBorderColorSuccess,
    warning: t.supportBorderColorWarning,
    info: t.supportBorderColorInfo,

    // --- "on" colours (text/icons drawn on top of the colours above) -----
    'on-primary': t.typographyColorPrimaryInvert,
    'on-secondary': t.typographyColorPrimary, // dark
    'on-background': t.typographyColorPrimary, // dark
    'on-surface': t.typographyColorPrimary, // dark
    'on-surface-variant': t.typographyColorPrimaryInvert,
    'on-error': t.typographyColorPrimaryInvert,
    'on-success': t.typographyColorPrimaryInvert,
    'on-info': t.typographyColorPrimaryInvert,
    'on-warning': t.typographyColorPrimary, // dark

    //// --- Custom colours -------------------------------------------------
    //// Vuetify exposes each as `--v-theme-<name>`, `bg-<name>`, `text-<name>`.
    link: t.typographyColorLink,
    'border-default': t.surfaceColorBorderDefault, // progress track, <hr>
    
    //// Keep custom colours here only when the component styles use them.
    //// State styles currently use design-token CSS variables directly.
    // 'primary-hover': t.surfaceColorPrimaryHover,
    // 'primary-pressed': t.surfaceColorPrimaryPressed,
    // 'primary-disabled': t.surfaceColorPrimaryDisabled,
    // 'error-hover': t.surfaceColorPrimaryDangerButtonHover,
    // 'error-disabled': t.surfaceColorPrimaryDangerButtonDisabled,

    //// Tinted backgrounds for alerts and banners.
    // 'info-surface': t.supportSurfaceColorInfo,
    // 'error-surface': t.supportSurfaceColorDanger,
    // 'success-surface': t.supportSurfaceColorSuccess,
    // 'warning-surface': t.supportSurfaceColorWarning,
    //// Vuetify would auto-pick black/white text here; use the BCDS text colour.
    // 'on-info-surface': t.typographyColorPrimary,
    // 'on-error-surface': t.typographyColorPrimary,
    // 'on-success-surface': t.typographyColorPrimary,
    // 'on-warning-surface': t.typographyColorPrimary,
    
    //// borders.
    //'border-color-default': t.surfaceColorBorderDefault, /** Lighter border colour 
    //'border-color-medium': t.surfaceColorBorderMedium, /** Default border colour for UI elements */
    //'border-color-dark': t.surfaceColorBorderDark, /** Used as a hover colour for form fields and inputs */
    //'border-color-active': t.surfaceColorBorderActive, /** Used as the active stroke colour for UI elements */for UI elements */

    //// Page-section backgrounds.
    // 'background-light-gray': t.surfaceColorBackgroundLightGray,
    // 'background-light-blue': t.surfaceColorBackgroundLightBlue,
    // 'background-dark-blue': t.surfaceColorBackgroundDarkBlue,

    //// Token colours used through Vuetify's own props (bgColor, scrim, color).
    // 'progress-track': t.themeGray30, // circular progress track
    // overlay: t.surfaceColorOverlayDefault, // dialog scrim
    // neutral: t.themeGray20, // default chip (BCDS gray tag)
    // 'on-neutral': t.typographyColorPrimary,
  },
  variables: {
    //'font-body': `${t.typographyFontFamiliesBcSans}, Calibri, Arial, "sans serif";`,
    // BCDS borders are solid, not Vuetify's 12%-opacity tint of on-surface.
    // Affects outlined fields and dividers; review visually.
    'border-color': t.surfaceColorBorderDefault,
    'border-opacity': 1,
    // BCDS text colours are solid, not Vuetify's 87% tint of on-surface.
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity':1,
    'disabled-opacity':1,
  },
} satisfies ThemeDefinition
