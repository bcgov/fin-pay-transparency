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


  // --- Feedback ------------------------------------------------------------
  // BCDS InlineAlert: tinted surface + 1px border in the status colour. An
  // outlined alert already draws the 1px status-coloured border and icon; the
  // surface and text colours are added in styles/.
  VAlert: { variant: 'outlined' },

  // Vuetify 4 draws dividers in currentColor (not --v-border-color), so give the
  // divider the BCDS border colour directly.
  VDivider: { color: 'border-default' },

  // BCDS tag: gray by default.
  VChip: { variant: 'outlined' },
  VChipGroup: { variant: 'outlined' },

  // BCDS progress: primary fill on a gray track, fully rounded bar.
  VProgressLinear: { color: 'primary', bgColor: 'border-default', bgOpacity: 1, rounded: 'pill' },
  VProgressCircular: { color: 'primary', bgColor: 'progress-track' },

  // --- Disclosure / surfaces --------------------------------------------
  VExpansionPanels: { variant: 'accordion' },
  VExpansionPanel: { elevation: 0 },

  // Pickers: selected day / clock hand in the primary colour.
  VTimePicker: { color: 'primary' },

  // --- Navigation and Structure -------------------------------------------------------
  VAppBar: { border: 'b', flat: true },
  VToolbar: { border: 'b', color: 'surface', density: 'compact' },

  // --- Inputs and Controls -------------------------------------------------------  
  VBtn: { ripple: false }, // ripple (the fun animated click effect) displays non-bcds colours on button press.
  VDatePicker: { hideHeader: true },
  
  VTextField: field,
  VTextarea: field,
  VSelect: field,
  VAutocomplete: field,
  VCombobox: field,
  VNumberInput: field,
  VDateInput: field,
  VFileInput: field,

  // Selection controls are unchecked-gray until `color` is set; make them blue.
  VCheckbox: { color: 'primary' },
  VRadio: { color: 'primary' },
  VSwitch: { color: 'primary' },
} satisfies Blueprint['defaults']
