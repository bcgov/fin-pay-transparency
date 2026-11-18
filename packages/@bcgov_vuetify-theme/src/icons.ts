import type { Blueprint } from 'vuetify'
import { aliases as faAliases, fa } from 'vuetify/iconsets/fa'

/**
 * Font Awesome (Free, webfont/CSS) as the default icon set.
 *
 * The CSS and font files come from @fortawesome/fontawesome-free, imported in
 * styles/index.css. Vuetify's own components use the `$name` aliases below
 * (e.g. `$close`, `$checkboxOn`), so MDI is never needed.
 *
 * Use icons in templates as `fas fa-home` (solid) or `far fa-star` (regular).
 * Brand icons (`fab ...`) need `brands.css` imported by the app.
 */
export const bcdsIcons = {
  defaultSet: 'fa',
  aliases: {
    ...faAliases,
    // Vuetify maps this to `fa-fullscreen`, which does not exist in Font Awesome
    // Free (checked against FA 6 and 7). Used by the video player's button.
    fullscreen: 'fas fa-expand',
  },
  sets: { fa },
} satisfies Blueprint['icons']
