import type { ThemeDefinition } from 'vuetify'
import * as t from '@bcgov/design-tokens/js'

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
    'on-primary': t.typographyColorPrimaryInvert, // = "#ffffff";
    'on-secondary': t.typographyColorPrimary, // = "#2d2d2d";
    'on-background': t.typographyColorPrimary, // = "#2d2d2d";
    'on-surface': t.typographyColorPrimary, // = "#2d2d2d";
    'on-surface-variant': t.typographyColorPrimaryInvert, // = "#ffffff";
    'on-error': t.typographyColorPrimaryInvert, // = "#ffffff";
    'on-success': t.typographyColorPrimaryInvert, // = "#ffffff";
    'on-info': t.typographyColorPrimaryInvert, // = "#ffffff";
    'on-warning': t.typographyColorPrimary, // = "#2d2d2d";

    // --- Custom colours -------------------------------------------------
    // These colours can be used in 'color' and 'bgColor' props. Also,
    // Vuetify exposes each as `--v-theme-<name>` in a variable, and as css classes like `bg-<name>`, `text-<name>`.

    // misc
    'border-default': t.surfaceColorBorderDefault, // progress track, <hr>

    // typography
    //'bcds-text-primary': t.typographyColorPrimary, // (USE "primary") // = "#2d2d2d"; // Default colour for all body text and headings
    //'bcds-text-secondary': t.typographyColorSecondary, // USE "on-surface") // "#474543"; // Alternative colour for secondary/miscellaneous text
    'bcds-text-placeholder': t.typographyColorPlaceholder, // "#9f9d9c"; // Use for placeholder text in forms
    'bcds-text-disabled': t.typographyColorDisabled, // "#9f9d9c"; // Use only for text in inactive user interface elements
    'bcds-text-link': t.typographyColorLink, // "#255a90"; // Use for hyperlinks in body text and headings
    //'bcds-text-danger': t.typographyColorDanger, // (USE "error") // "#ce3e39"; // Use for error, failure or danger message text
    //'bcds-text-primary-invert': t.typographyColorPrimaryInvert, // (USE "on-primary") // "#ffffff"; // Default colour for text on dark backgrounds
    'bcds-text-secondary-invert': t.typographyColorSecondaryInvert, // "#eceae8"; // Secondary colour for text on dark backgrounds

    // surfaces
    //'bcds-bg-white': t.surfaceColorBackgroundWhite, // (USE "surface") // = "#ffffff"; // White background
    'bcds-bg-lightGray': t.surfaceColorBackgroundLightGray, // = "#faf9f8"; // Default background colour for layout
    'bcds-bg-lightBlue': t.surfaceColorBackgroundLightBlue, // = "#f1f8fe"; // Light blue background
    'bcds-bg-darkBlue': t.surfaceColorBackgroundDarkBlue, // = "#053662"; // Dark blue background

    // on-[label] colours are automatically applied
    //'on-bcds-bg-white': t.typographyColorPrimary, // (USE "on-surface") // = "#2d2d2d";
    'on-bcds-bg-lightGray': t.typographyColorPrimary, // = "#2d2d2d";
    'on-bcds-bg-lightBlue': t.typographyColorPrimary, // = "#2d2d2d"; 
    'on-bcds-bg-darkBlue': t.typographyColorPrimaryInvert, // = "#ffffff";

    // colour scales
    'bcds-blue': t.themePrimaryBlue, // Primary Blue (Blue 100)
    'bcds-gold': t.themePrimaryGold, // Primary Gold (Gold 100)
    'bcds-white': t.themeGrayWhite, // White
    'bcds-gold-10': t.themeGold10, // Gold scale — lightest
    'bcds-gold-20': t.themeGold20, // Gold scale
    'bcds-gold-30': t.themeGold30, // Gold scale
    'bcds-gold-40': t.themeGold40, // Gold scale
    'bcds-gold-50': t.themeGold50, // Gold scale
    'bcds-gold-60': t.themeGold60, // Gold scale
    'bcds-gold-70': t.themeGold70, // Gold scale
    'bcds-gold-80': t.themeGold80, // Gold scale
    'bcds-gold-90': t.themeGold90, // Gold scale
    'bcds-gold-100': t.themeGold100, // Gold scale — darkest
    'bcds-blue-10': t.themeBlue10, // Blue scale — lightest
    'bcds-blue-20': t.themeBlue20, // Blue scale
    'bcds-blue-30': t.themeBlue30, // Blue scale
    'bcds-blue-40': t.themeBlue40, // Blue scale
    'bcds-blue-50': t.themeBlue50, // Blue scale
    'bcds-blue-60': t.themeBlue60, // Blue scale
    'bcds-blue-70': t.themeBlue70, // Blue scale
    'bcds-blue-80': t.themeBlue80, // Blue scale
    'bcds-blue-90': t.themeBlue90, // Blue scale
    'bcds-blue-100': t.themeBlue100, // Blue scale — darkest
    'bcds-gray-10': t.themeGray10, // Greyscale — lightest
    'bcds-gray-20': t.themeGray20, // Greyscale
    'bcds-gray-30': t.themeGray30, // Greyscale
    'bcds-gray-40': t.themeGray40, // Greyscale
    'bcds-gray-50': t.themeGray50, // Greyscale
    'bcds-gray-60': t.themeGray60, // Greyscale
    'bcds-gray-70': t.themeGray70, // Greyscale
    'bcds-gray-80': t.themeGray80, // Greyscale
    'bcds-gray-90': t.themeGray90, // Greyscale
    'bcds-gray-100': t.themeGray100, // Greyscale
    'bcds-gray-110': t.themeGray110, // Greyscale — darkest

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
    'font-body': `${t.typographyFontFamiliesBcSans}, Calibri, Arial, "sans serif";`,
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
