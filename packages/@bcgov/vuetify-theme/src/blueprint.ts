import type { Blueprint } from 'vuetify'
import { bcdsDefaults } from './defaults'
import { bcdsIcons } from './icons'
import { BCDS_THEME_NAME, bcdsTheme } from './theme'


// B.C. Design System blueprint for Vuetify 4. (Colours, icons and component defaults.)
export const bcdsBlueprint = {
  theme: {
    defaultTheme: BCDS_THEME_NAME,
    themes: { [BCDS_THEME_NAME]: bcdsTheme },
  },
  defaults: bcdsDefaults,
  icons: bcdsIcons,
} satisfies Blueprint


// Basic B.C. Design System blueprint for Vuetify 4. (Colours and icons.)
export const bcdsBasicBlueprint = {
  theme: {
    defaultTheme: BCDS_THEME_NAME,
    themes: { [BCDS_THEME_NAME]: bcdsTheme },
  },
  //defaults: bcdsDefaults,
  icons: bcdsIcons,
} satisfies Blueprint
