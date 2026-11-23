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
    primary: t.surfaceColorPrimaryDefault, // "#013366"; // Default theme colour for components and layout
    secondary: t.themePrimaryGold, //"#fcba19"

    background: t.surfaceColorBackgroundWhite, // "#ffffff"; // White background
    surface: t.surfaceColorBackgroundWhite, // "#ffffff"; // White background
    // Vuetify uses surface-variant as its dark/inverse surface (tooltips draw on it).
    'surface-variant': t.themeGray110,

    // Status colours use the BCDS "support" border colours (the saturated ones).
    error: t.supportBorderColorDanger, // "#ce3e39"; // Border stroke for error, failure or danger messages
    success: t.supportBorderColorSuccess, // "#42814a"; // Border stroke for success messages
    warning: t.supportBorderColorWarning, // "#f8bb47"; // Border stroke for warning messages
    info: t.supportBorderColorInfo, // "#053662"; // Border stroke for general/informational messages

    // --- "on" colours (text/icons drawn on top of the colours above) -----
    'on-primary': t.typographyColorPrimaryInvert, // "#ffffff";
    'on-secondary': t.typographyColorPrimary, // "#2d2d2d";
    'on-background': t.typographyColorPrimary, // "#2d2d2d";
    'on-surface': t.typographyColorPrimary, // "#2d2d2d";
    'on-surface-variant': t.typographyColorPrimaryInvert, // "#ffffff";
    'on-error': t.typographyColorPrimaryInvert, // "#ffffff";
    'on-success': t.typographyColorPrimaryInvert, // "#ffffff";
    'on-info': t.typographyColorPrimaryInvert, // "#ffffff";
    'on-warning': t.typographyColorPrimary, // "#2d2d2d";

    // --- Custom colours -------------------------------------------------
    // These colours can be used in 'color' and 'bgColor' props. Also,
    // Vuetify exposes each as `--v-theme-<name>` in a variable, and as css classes like `bg-<name>`, `text-<name>`.

    // misc
    'border-default': t.surfaceColorBorderDefault, // progress track, <hr>

    // typography
    //'bcds-text-primary': t.typographyColorPrimary, // (USE "primary") // "#2d2d2d"; // Default colour for all body text and headings
    'bcds-text-secondary': t.typographyColorSecondary, // "#474543"; // Alternative colour for secondary/miscellaneous text
    'bcds-text-placeholder': t.typographyColorPlaceholder, // "#9f9d9c"; // Use for placeholder text in forms
    'bcds-text-disabled': t.typographyColorDisabled, // "#9f9d9c"; // Use only for text in inactive user interface elements
    'bcds-text-link': t.typographyColorLink, // "#255a90"; // Use for hyperlinks in body text and headings
    //'bcds-text-danger': t.typographyColorDanger, // (USE "error") // "#ce3e39"; // Use for error, failure or danger message text
    //'bcds-text-primary-invert': t.typographyColorPrimaryInvert, // (USE "on-primary") // "#ffffff"; // Default colour for text on dark backgrounds
    'bcds-text-secondary-invert': t.typographyColorSecondaryInvert, // "#eceae8"; // Secondary colour for text on dark backgrounds

    // surfaces
    //'bcds-bg-white': t.surfaceColorBackgroundWhite, // (USE "surface") // "#ffffff"; // White background
    'bcds-bg-lightGray': t.surfaceColorBackgroundLightGray, // "#faf9f8"; // Default background colour for layout
    'bcds-bg-lightBlue': t.surfaceColorBackgroundLightBlue, // "#f1f8fe"; // Light blue background
    'bcds-bg-darkBlue': t.surfaceColorBackgroundDarkBlue, // "#053662"; // Dark blue background

    // on-[label] colours are automatically applied
    //'on-bcds-bg-white': t.typographyColorPrimary, // (USE "on-surface") // "#2d2d2d";
    'on-bcds-bg-lightGray': t.typographyColorPrimary, // "#2d2d2d";
    'on-bcds-bg-lightBlue': t.typographyColorPrimary, // "#2d2d2d"; 
    'on-bcds-bg-darkBlue': t.typographyColorPrimaryInvert, // "#ffffff";

    // colour scales
    'bcds-blue': t.themePrimaryBlue,  // "#013366"; // Primary Blue (Blue 100)
    'bcds-gold': t.themePrimaryGold,  // "#fcba19"; // Primary Gold (Gold 100)
    'bcds-white': t.themeGrayWhite,   // "#ffffff"; // White
    'bcds-gold-10': t.themeGold10,    // "#fef8e8"; // Gold scale — lightest  
    'bcds-gold-20': t.themeGold20,    // "#fef0d8"; // Gold scale  
    'bcds-gold-30': t.themeGold30,    // "#fde9c4"; // Gold scale  
    'bcds-gold-40': t.themeGold40,    // "#fce2b0"; // Gold scale  
    'bcds-gold-50': t.themeGold50,    // "#fbda9d"; // Gold scale  
    'bcds-gold-60': t.themeGold60,    // "#fbd389"; // Gold scale  
    'bcds-gold-70': t.themeGold70,    // "#facc75"; // Gold scale  
    'bcds-gold-80': t.themeGold80,    // "#f9c462"; // Gold scale  
    'bcds-gold-90': t.themeGold90,    // "#f8ba47"; // Gold scale  
    'bcds-gold-100': t.themeGold100,  // "#fcba19"; // Gold scale — darkest    
    'bcds-blue-10': t.themeBlue10,    // "#f1f8fe"; // Blue scale — lightest  
    'bcds-blue-20': t.themeBlue20,    // "#d8eafd"; // Blue scale  
    'bcds-blue-30': t.themeBlue30,    // "#c1ddfc"; // Blue scale  
    'bcds-blue-40': t.themeBlue40,    // "#a8d0fb"; // Blue scale  
    'bcds-blue-50': t.themeBlue50,    // "#91c4fa"; // Blue scale  
    'bcds-blue-60': t.themeBlue60,    // "#7ab8f9"; // Blue scale  
    'bcds-blue-70': t.themeBlue70,    // "#5595d9"; // Blue scale  
    'bcds-blue-80': t.themeBlue80,    // "#3470b1"; // Blue scale  
    'bcds-blue-90': t.themeBlue90,    // "#1e5189"; // Blue scale  
    'bcds-blue-100': t.themeBlue100,  // "#013366"; // Blue scale — darkest     
    'bcds-gray-10': t.themeGray10,    // "#faf9f8"; // Greyscale — lightest  
    'bcds-gray-20': t.themeGray20,    // "#f3f2f1"; // Greyscale  
    'bcds-gray-30': t.themeGray30,    // "#eceae8"; // Greyscale  
    'bcds-gray-40': t.themeGray40,    // "#e0dedc"; // Greyscale  
    'bcds-gray-50': t.themeGray50,    // "#d1cfcd"; // Greyscale  
    'bcds-gray-60': t.themeGray60,    // "#c6c5c3"; // Greyscale  
    'bcds-gray-70': t.themeGray70,    // "#9f9d9c"; // Greyscale  
    'bcds-gray-80': t.themeGray80,    // "#605e5c"; // Greyscale  
    'bcds-gray-90': t.themeGray90,    // "#3d3c3b"; // Greyscale  
    'bcds-gray-100': t.themeGray100,  // "#353433"; // Greyscale    
    'bcds--gray-110': t.themeGray110, // "#252423"; // Greyscale — darkest     

    // Tinted backgrounds for alerts and banners.
    'bcsd-surface-info': t.supportSurfaceColorInfo, // "#f7f9fc";
    'bcsd-surface-error': t.supportSurfaceColorDanger, // "#f4e1e2"; // Background colour for error, failure or danger messages
    'bcsd-surface-success': t.supportSurfaceColorSuccess, // "#f6fff8"; // Background colour for success messages
    'bcsd-surface-warning': t.supportSurfaceColorWarning, // "#fef1d8"; // Background colour for warning messages
    // Vuetify would auto-pick black/white text here; use the BCDS text colour.
    'on-bcsd-surface-info': t.typographyColorPrimary, // "#2d2d2d"; 
    'on-bcsd-surface-error': t.typographyColorPrimary, // "#2d2d2d"; 
    'on-bcsd-surface-success': t.typographyColorPrimary, // "#2d2d2d"; 
    'on-bcsd-surface-warning': t.typographyColorPrimary, // "#2d2d2d"; 
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
