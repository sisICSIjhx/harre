import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { readTheme, setTheme, useThemeMode } from '../../src/shared/design/theme-mode.js'
import { setDesignMode } from '../../src/shared/design/design-mode.js'

afterEach(() => vi.unstubAllGlobals())
describe('apariencia del nuevo diseño', () => {
  it('restaura oscuro y descarta preferencias inválidas', () => {
    expect(readTheme({ getItem: () => 'dark' })).toBe('dark')
    expect(readTheme({ getItem: () => 'invalid' })).toBe('light')
  })
  it('funciona cuando el almacenamiento está bloqueado', () => {
    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('blocked')
      },
    })
    expect(readTheme()).toBe('light')
    setTheme('dark')
    expect(useThemeMode().theme.value).toBe('dark')
    expect(useThemeMode().saved.value).toBe(false)
  })
  it('retira el tema oscuro al volver al diseño actual y lo recupera al regresar', async () => {
    const toggle = vi.fn()
    vi.stubGlobal('window', { localStorage: { setItem: vi.fn() } })
    vi.stubGlobal('document', { documentElement: { dataset: {}, classList: { toggle } } })
    setTheme('dark')
    setDesignMode('next')
    await nextTick()
    expect(toggle).toHaveBeenLastCalledWith('app-dark', true)
    setDesignMode('current')
    await nextTick()
    expect(toggle).toHaveBeenLastCalledWith('app-dark', false)
    setDesignMode('next')
    await nextTick()
    expect(toggle).toHaveBeenLastCalledWith('app-dark', true)
  })
})
