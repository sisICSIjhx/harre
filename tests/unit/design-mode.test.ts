import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  DESIGN_STORAGE_KEY,
  parseDesignMode,
  readDesignMode,
  setDesignMode,
  useDesignMode,
} from '../../src/shared/design/design-mode.js'

afterEach(() => vi.unstubAllGlobals())
describe('preferencia visual sin datos personales', () => {
  it.each([null, undefined, '', 'dark', '{}', 'NEXT'])('usa actual ante %s', (value) => {
    expect(parseDesignMode(value)).toBe('current')
  })
  it('restaura la preferencia válida', () => {
    const getItem = vi.fn(() => 'next')
    expect(readDesignMode({ getItem })).toBe('next')
    expect(getItem).toHaveBeenCalledWith(DESIGN_STORAGE_KEY)
  })
  it('tolera un almacenamiento bloqueado', () => {
    expect(
      readDesignMode({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).toBe('current')
    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('blocked')
      },
    })
    setDesignMode('next')
    expect(useDesignMode().mode.value).toBe('next')
    expect(useDesignMode().storageAvailable.value).toBe(false)
    setDesignMode('current')
  })
  it('guarda solo el modo y lo aplica a la raíz', () => {
    const setItem = vi.fn()
    const dataset: Record<string, string> = {}
    vi.stubGlobal('window', { localStorage: { setItem } })
    vi.stubGlobal('document', { documentElement: { dataset } })
    setDesignMode('next')
    expect(setItem).toHaveBeenCalledWith(DESIGN_STORAGE_KEY, 'next')
    expect(dataset.design).toBe('next')
    setDesignMode('current')
    expect(dataset.design).toBe('current')
  })
})
