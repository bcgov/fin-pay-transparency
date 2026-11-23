# @bcgov/vuetify-theme

## Description
A Vuetify theme package that applies BC Government design system styles, defaults, aliases, and design tokens to Vue applications. It provides a standard setup for full B.C. Design System styling and a basic setup that limits the changes to theme colours.

> **Note:** This package is currently in a preliminary state. It meets the needs of the application that uses it, but further evaluation is recommended to improve compatibility and broader reuse. See the Development section below for details.

## Getting started

This package will automatically setup these packages so you don't have to
- BC Sans
- BC Design System tokens (CSS Variables)
- Font Awesome Free

### Dependencies
- Vuetify 4
- Vite

If the package is checked out at `./packages/@bcgov_vuetify-theme` relative to your app, add the local path to your app's `package.json`:

```jsonc

// package.json
{
  "dependencies": {
    "@bcgov/vuetify-theme": "file:./packages/@bcgov_vuetify-theme"
  }
}
```

Then run `npm install` from your app or workspace root.

Import the themed stylesheet in your app entry point, then pass the corresponding blueprint to Vuetify. The standard setup includes the full theme and modifies Vuetify's underlying styles. Because these styles may change between Vuetify releases, verify the affected components whenever you upgrade Vuetify. Use the basic setup if you prefer to keep Vuetify's underlying CSS unchanged; it applies the theme colours and defaults without the additional style overrides.

```ts
// src/main.ts
import '@bcgov/vuetify-theme/styles'
//import '@bcgov/vuetify-theme/styles/basic' // import basic instead to avoid custom CSS
import 'vuetify/styles'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { bcdsBlueprint, bcdsBasicBlueprint } from '@bcgov/vuetify-theme'
import App from './App.vue'

const vuetify = createVuetify({ blueprint: bcdsBlueprint })
//const vuetify = createVuetify({ blueprint: bcdsBasicBlueprint }) // use basic to avoid changes to defaults 
createApp(App).use(vuetify).mount('#app')
```

## Usage
Use the themed colours defined in [theme.ts](./src/theme.ts) in vueitfy props.
```html
<v-card bgColor="bcds-bg-lightGray">...</v-card>
```

Use the aliases defined in [aliases.ts](./src/aliases.ts) as shortcuts to common styled components.
```html
<v-btn-primary>Primary</v-btn-primary>
<v-btn-secondary>Secondary</v-btn-secondary>
<v-btn-tertiary>Tertiary</v-btn-tertiary>
<v-btn-link>Link</v-btn-link>
```

Use the utility CSS classes defined in [core.css](./src/styles/core.css)
```html
<h3> Header 3 </h3>
<span class="text-h3"> Header 3 </span>
```

Use the CSS variables defined in [variables.css](https://github.com/bcgov/design-system/blob/main/packages/design-tokens/dist/css-prefixed/variables.css) which are imported by this package.
```html
<style>
.my-style {
  color: var(--bcds-theme-primary-blue);
}
```

## Customization
You can override or extend blueprint values by passing Vuetify options alongside the blueprint. Vuetify deep-merges these options over the blueprint:

```ts
createVuetify({
  blueprint: bcdsBlueprint,
  theme: {
    themes: {
      light: {
        colors: {
          tab: t.themeBlue90, //add a custom color
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: '0' }, //override blueprint defaults
  },
})
```

For CSS changes, add styles in your app rather than editing this package. If you need to add or reorder cascade layers, copy the `@layer` order declaration from [`src/styles/index.css`](./src/styles/index.css) into your own stylesheet and adjust it there. The standard stylesheet uses the `bcds-components`, `bcds-styles`, and `bcds-states` layers.

## Demos
The repository includes two demos:
- [`demos/bcgov-react-components-demo`](./demos/bcgov-react-components-demo)
  shows the BC Design System React components and the visual target this  conversion aims to achieve.
- [`demos/bcgov-vuetify-style-demo`](./demos/bcgov-vuetify-style-demo) shows the
  current Vuetify implementation.

Run the Vuetify demo from its directory with `npm run dev` for the standard demo, or `npm run dev:basic` for the basic demo. Run the React demo from its directory with `npm run dev`.

## Development
This instance is a preliminary release. Built specifically for this project with the intention of becoming a library that could be used in many projects. While this version can be used in more projects, I think it would benefit from a review of the goals and decisions of this project; what is and isn't required to be compliant.

> **Tip:** While developing, vite doesn't automatically pickup changes to packages. Add --force to vite npm command to force vite to recompile. If using vscode, you can restart the admin-frontend debugger to quickly reload changes (only if --force was used).

### TODO
- Add BC themed header and footer (like BCDS Aria React components)
- Consider exposing all BCDS colour tokens as custom Vuetify theme colours. This would allow BCDS colours to be used in components' props.
- Expand both demos to cover more component states and compare them with the React design-system components.
- Document the equivalent componets in Vuetify that are the same as BCDS Aria React.

### Decisions
- Should this library keep the material design colour calculations? Or should we replace the material design colour calculations with custom CSS to match the BCDS tokens?
  - For example, BCDS tokens specify hover and click colour of buttons. Vuetify doesn't expose any way to modify those colours. Should it be left alone, and use Vuetify colours, or do we use CSS to override Vuetify?
  - DECISION: Use custom CSS to override Vuetify. Seen in src/styles/states.css
- Should this library match BCDS Aria React as closely as possible?
  - For example, tags in BCDS are a light colour background with a border, whereas chips in Vuetify are a bold colour with white text.
  - DECISION: Match BCDS Aria React as much as possible. Seen in src/defaults.ts
  - This is still a WIP. (See Challenges below.)

Decided not to do:
- Recreate BCDS Aria React components in Vuetify.
  - For example, For example, React has AlertBanner which is equivalent to Vuetify SnackBar. AlertBanner can be created in Vuetify with a single line `"AlertBanner: VSnackBar";`. Now `<alert-banner />` exists in Vuetify.
- Prepend -bcds- to custom componets to be clear about where the component comes from.
  - For example `<bcds-btn-primary />` or `<bcds-alert-banner />`
- Add styles to Vuetify components that have no equivalents in BCDS Aria React components.
- Import icons used in BCDS Aria React into this package.

### Challenges
- Vuetify is Material Design, which is not compatible with BCDS's token for every colour. Modifying underlying Vuetify CSS carries some risk as future versions of Vuetify may not use the same HTML/CSS structure.
- Modifying CSS and Defaults can have side effects that cause other components, or even the same component with different varients to look off.
- Trying to match BCDS Aria React may not be an achievable goal. Everything is just a little different and it may not be possible to get everything the same. For example, button heights, default font sizes of every component, and more.
- Attempted to use `settings.scss` to modify underlying styles. This caused a longer build time which impacted the development experience. The only real value of this file was setting the fonts, but it was easy enough to set the fonts in CSS. Although the file is unused, it is still included in the source code as there are some examples of values that could be modified. Perhaps a future review could find some value for this file.

### Ideas

#### Smarter use of CSS
Perhaps re-evaluating the usage of CSS could provide more control, and a more stable usage.

For example, consider this is always applied to all plain buttons (ie. link buttons).
``` CSS
.v-btn--variant-plain:not(.v-btn--icon) .v-btn__content {
  text-decoration: underline;
  text-underline-offset: 0.3em;
}
```
But if instead we make our own class `.bcds-btn-link`.
``` CSS
.bcds-btn-link .v-btn__content {
  text-decoration: underline;
  text-underline-offset: 0.3em;
}
```
and then change the alias to
``` TypeScript
  VBtnLink: {
    variant: 'plain',
    color: 'bcds-text-link',
    ripple: false,
    class: 'bcds-btn-link'
  },
```
With this, we would have greater control over which plain buttons are styled.

Are there more instances that could benefit from this kind of change?