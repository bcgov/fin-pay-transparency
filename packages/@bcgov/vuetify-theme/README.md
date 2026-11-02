## Getting started

Vuetify 4 is a peer dependency and must be installed in your app. This package
is currently private and is not published to npm. It ships TypeScript source and
is intended to be consumed by Vite.

BC Sans, the BC Design System tokens, and Font Awesome are included and wired up
by the package, so you do not need to install or configure them separately.

### 1. Install

If the package is checked out at `./packages/@bcgov/vuetify-theme` relative to
your app, add the local path to your app's `package.json`:

```json
{
  "dependencies": {
    "@bcgov/vuetify-theme": "file:./packages/@bcgov/vuetify-theme"
  }
}
```

Then run `npm install` from your app or workspace root.

### 2. Configure Vite

Enable component auto-imports and point `vite-plugin-vuetify` at the package's
Sass settings:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      styles: {
        configFile:
          'node_modules/@bcgov/vuetify-theme/src/styles/settings.scss',
      },
    }),
  ],
})
```

### 3. Set up Vuetify and styles

Import the package stylesheet once in your entry point, and pass the blueprint
to Vuetify:

> **Note:** The standard setup makes substantial changes to the internal
> Vuetify's styling, so Vuetify updates may be less predictable and can
> introduce visual regressions. Use only the basic setup (below) or recheck 
> your app when upgrading Vuetify.

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

You now have the standard BCDS setup. Blueprints configure Vuetify but do not
load CSS, so the blueprint and stylesheet are always chosen as a pair.

## Basic setup

If you only want the BCDS colors and icons, without the component defaults or
component and state styles, switch to the basic setup. The Vite config stays the
same. Change only these two imports:

```ts
// src/main.ts
import '@bcgov/vuetify-theme/styles/index.basic.css'
```

```ts
// src/plugins/vuetify.ts
import { bcdsBasicBlueprint } from '@bcgov/vuetify-theme/blueprint'

export default createVuetify({ blueprint: bcdsBasicBlueprint })
```

The basic stylesheet still includes the tokens, BC Sans, and Font Awesome. To use
no package CSS at all, omit the stylesheet import.

## Customization

You can override or extend blueprint values by passing Vuetify options alongside
the blueprint. Vuetify deep-merges these options over the blueprint:

```ts
export default createVuetify({
  blueprint: bcdsBlueprint,
  defaults: {
    VBtn: { rounded: '0' },
  },
})
```

For CSS changes, add styles in your app rather than editing this package. If you
need to add or reorder cascade layers, copy the `@layer` order declaration from
[`src/styles/index.css`](./src/styles/index.css) into your own stylesheet and
adjust it there. The standard stylesheet uses the `bcds-components`,
`bcds-styles`, and `bcds-states` layers.

## Demos

The repository includes two demos:

- [`demos/bcgov-react-components-demo`](./demos/bcgov-react-components-demo)
  shows the BC Design System React components and the visual target this
  conversion aims to achieve.
- [`demos/bcgov-vuetify-style-demo`](./demos/bcgov-vuetify-style-demo) shows the
  current Vuetify implementation.

Run the Vuetify demo from its directory with `npm run dev` for the standard
demo, or `npm run dev:basic` for the basic demo. Run the React demo from its
directory with `npm run dev`.
