import type { Blueprint } from 'vuetify'
import { bcdsDefaults } from './defaults'
import { bcdsIcons } from './icons'
import { bcdsTheme } from './theme'
import { bcdsAliases,bcdsAliasDefaults } from './aliases'


// B.C. Design System blueprint for Vuetify 4. (Colours, icons and component defaults.)
export const bcdsBlueprint = {
  theme: {
    defaultTheme: 'light',
    themes: { light: bcdsTheme },
  },
  aliases: bcdsAliases,
  defaults: {...bcdsDefaults, ...bcdsAliasDefaults},
  icons: bcdsIcons,
} satisfies Blueprint


// Basic B.C. Design System blueprint for Vuetify 4. (Colours and icons.)
export const bcdsBasicBlueprint = {
  theme: {
    defaultTheme: 'light',
    themes: { light: bcdsTheme },
  },
  //defaults: bcdsDefaults,
  icons: bcdsIcons,
} satisfies Blueprint
