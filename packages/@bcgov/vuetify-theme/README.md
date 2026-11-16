## Getting started

Vuetify 4 is a peer dependency and must be installed in your app. This package is currently private and is not published to npm. It ships TypeScript source and is intended to be consumed by Vite.

BC Sans, the BC Design System tokens, and Font Awesome are included and wired up by the package, so you do not need to install or configure them separately.

### 1. Install

If the package is checked out at `./packages/@bcgov/vuetify-theme` relative to your app, add the local path to your app's `package.json`:

```json
{
  "dependencies": {
    "@bcgov/vuetify-theme": "file:./packages/@bcgov/vuetify-theme"
  }
}
```

Then run `npm install` from your app or workspace root.

### 2. Set up Vuetify and styles

Import the package stylesheet once in your entry point, and pass the blueprint to Vuetify:

> **Note:** The standard setup makes substantial changes to the internal Vuetify's styling, so Vuetify updates may be less predictable and can introduce visual regressions. Recheck your app when upgrading Vuetify or use the basic setup (details below).

```ts
// src/main.ts
import '@bcgov/vuetify-theme/styles/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'

createApp(App).use(vuetify).mount('#app')
```

```ts
// src/plugins/vuetify.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { bcdsBlueprint } from '@bcgov/vuetify-theme/blueprint'

export default createVuetify({ blueprint: bcdsBlueprint })
```

You now have the standard BCDS setup. Blueprints configure Vuetify but do not load CSS, so the blueprint and stylesheet are always chosen as a pair.

## Basic setup

If you only want the BCDS colours and icons, without the component defaults or component and state styles, switch to the basic setup. The Vite config stays the same. Change only these two imports:

```ts
// src/main.ts
import '@bcgov/vuetify-theme/styles/index.basic.css'
```

```ts
// src/plugins/vuetify.ts
import { bcdsBasicBlueprint } from '@bcgov/vuetify-theme/blueprint'

export default createVuetify({ blueprint: bcdsBasicBlueprint })
```

The basic stylesheet still includes the tokens, BC Sans, and Font Awesome. To use no package CSS at all, omit the stylesheet import.

## Customization

You can override or extend blueprint values by passing Vuetify options alongside the blueprint. Vuetify deep-merges these options over the blueprint:

```ts
export default createVuetify({
  blueprint: bcdsBlueprint,
  defaults: {
    VBtn: { rounded: '0' },
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

### TODO
- Add BC themed header and footer (like React design-system components)
- Consider exposing all BCDS colour tokens as custom Vuetify theme colours. This would allow BCDS colours to be used in components' props.
- Expand both demos to cover more component states and compare them with the React design-system components.

### Decisions
- Should this library keep the material design colour calculations? Or should we replace the material design colour calculations with custom CSS to match the BCDS tokens?
  - For example, BCDS tokens specify hover and click colour of buttons. Vuetify doesn't expose any way to modify those colours. Should it be left alone, and use Vuetify colours, or do we use CSS to override Vuetify?
  - DECISION: Use custom CSS to override Vuetify. Seen in src/styles/states.css
- Should this library match BCDS Aria React as closely as possible?
  - For example, tags in BCDS are a light colour background with a border, whereas chips in Vuetify are a bold colour with white text.
  - DECISION: Match BCDS Aria React as much as possible. Seen in src/defaults.ts

### Challenges
- Vuetify is Material Design, which is not compatible with BCDS's token for every colour. Modifying underlying Vuetify CSS carries some risk as future versions of Vuetify may not use the same HTML/CSS structure.
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