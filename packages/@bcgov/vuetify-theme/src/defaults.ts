import type { Blueprint } from 'vuetify'

/**
 * Component defaults: prop values applied when a template doesn't pass one.
 * These are plain JS applied at render time and generate no CSS. A prop set
 * in a template always wins.
 *
 * Every entry here is a DECISION. Only things the design system always wants
 * belong here, so apps aren't surprised by hidden behaviour. Anything Vuetify
 * has no prop for is done in styles/ (CSS layers `org` and `org-states`).
 */

// BCDS form fields: outlined on white. Focus uses the BCDS "active" blue
// (theme colour `border-active`); idle/hover/error borders are in styles/.
const field = { variant: 'outlined', density: 'comfortable' } as const

export const bcdsDefaults = {

  VIcon: { size: 'small' }, //Font Awsome icons are too big by default.
  VBtn: { ripple: false }, // ripple (the fun animated click effect) displays non-bcds colours on button press.

  // --- Default appearance of BCDS components ---
  VAlert: { variant: 'outlined' },
  VDivider: { color: 'border-default' },
  VChip: { variant: 'outlined' },
  VChipGroup: { variant: 'outlined' },
  VProgressLinear: { color: 'primary', bgColor: 'border-default', bgOpacity: 1, rounded: 'pill' },
  VProgressCircular: { color: 'primary', bgColor: 'progress-track' },
  VExpansionPanels: { variant: 'accordion' },
  VExpansionPanel: { elevation: 0 },
  VTimePicker: { color: 'primary' },
  VAppBar: { border: 'b', flat: true },
  VToolbar: { border: 'b', color: 'surface', density: 'compact' },
  VDatePicker: { hideHeader: true },
  VCheckbox: { color: 'primary' },
  VRadio: { color: 'primary' },
  VSwitch: { color: 'primary' },  

  VTextField: field,
  VTextarea: field,
  VSelect: field,
  VAutocomplete: field,
  VCombobox: field,
  VNumberInput: field,
  VDateInput: field,
  VFileInput: field,


} satisfies Blueprint['defaults']
