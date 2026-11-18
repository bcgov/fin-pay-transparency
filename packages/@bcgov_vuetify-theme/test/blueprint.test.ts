import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import { BCDS_THEME_NAME, bcdsBlueprint, bcdsIcons, bcdsTheme } from '../src'

describe('bcds blueprint', () => {
  it('registers the bcds theme and makes it the default', () => {
    const vuetify = createVuetify({ blueprint: bcdsBlueprint })
    expect(vuetify.theme.name.value).toBe(BCDS_THEME_NAME)
    expect(vuetify.theme.themes.value[BCDS_THEME_NAME].colors.primary).toBe('#013366')
  })

  it('applies component defaults', () => {
    const vuetify = createVuetify({ blueprint: bcdsBlueprint })
    expect(vuetify.defaults.value?.VBtn).toMatchObject({ color: 'primary', variant: 'flat' })
    expect(vuetify.defaults.value?.VIcon).toMatchObject({ size: 'small' })
  })

  it('lets app options override the blueprint', () => {
    const vuetify = createVuetify({
      blueprint: bcdsBlueprint,
      defaults: { VBtn: { variant: 'outlined' } },
      theme: { themes: { [BCDS_THEME_NAME]: { colors: { primary: '#000000' } } } },
    })
    expect(vuetify.defaults.value?.VBtn).toMatchObject({ color: 'primary', variant: 'outlined' })
    expect(vuetify.theme.themes.value[BCDS_THEME_NAME].colors.primary).toBe('#000000')
    // untouched values survive the merge
    expect(vuetify.theme.themes.value[BCDS_THEME_NAME].colors.error).toBe('#ce3e39')
  })

  it('has no empty colour values', () => {
    for (const [name, value] of Object.entries(bcdsTheme.colors)) {
      expect(value, `colour "${name}"`).toMatch(/^(#[0-9a-f]{6}|rgba?\(.+\))$/i)
    }
  })
})

describe('icons (Font Awesome)', () => {
  const vuetify = createVuetify({ blueprint: bcdsBlueprint })
  const aliases = vuetify.icons.aliases as Record<string, unknown>

  it('uses Font Awesome as the default set', () => {
    expect(vuetify.icons.defaultSet).toBe('fa')
    expect(aliases.close).toBe('fas fa-times')
    expect(aliases.checkboxOff).toBe('far fa-square')
  })

  it('leaves no alias pointing at MDI', () => {
    const mdi = Object.entries(aliases).filter(([, v]) => typeof v === 'string' && v.startsWith('mdi-'))
    expect(mdi).toEqual([])
  })

  it('replaces the Vuetify alias whose Font Awesome class does not exist', () => {
    expect(aliases.fullscreen).toBe('fas fa-expand')
  })

  // Drift guard: fails if a Vuetify or Font Awesome upgrade leaves an alias
  // pointing at a class that the installed Font Awesome CSS does not define.
  it('every alias class is defined by the installed Font Awesome CSS', () => {
    const dir = join(dirname(createRequire(import.meta.url).resolve('@fortawesome/fontawesome-free/package.json')), 'css')
    const css = ['fontawesome', 'solid', 'regular'].map(f => readFileSync(join(dir, `${f}.css`), 'utf8')).join('\n')
    const missing: string[] = []
    for (const [name, value] of Object.entries(bcdsIcons.aliases)) {
      if (typeof value !== 'string') continue
      for (const cls of value.split(/\s+/)) {
        if (!new RegExp(`\\.${cls}(?![\\w-])`).test(css)) missing.push(`${name}: ${cls}`)
      }
    }
    expect(missing).toEqual([])
  })
})
