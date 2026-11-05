import type { Blueprint } from 'vuetify'
import { bcdsDefaults } from './defaults'
import { bcdsIcons } from './icons'
import { bcdsTheme } from './theme'


// B.C. Design System blueprint for Vuetify 4. (Colours, icons and component defaults.)
export const bcdsBlueprint = {
  theme: {
    defaultTheme: 'light',
    themes: { light: bcdsTheme },
  },
  defaults: bcdsDefaults,
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
