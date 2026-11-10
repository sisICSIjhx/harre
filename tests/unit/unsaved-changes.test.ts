import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, ref } from 'vue'
import {
  answerDiscard,
  confirmDiscardChanges,
  discardPrompt,
  hasPendingChanges,
  releasePendingChanges,
  useUnsavedChanges,
} from '../../src/shared/design/unsaved-changes.js'

afterEach(() => {
  answerDiscard(false)
  releasePendingChanges()
})
describe('protección de captura en memoria', () => {
  it('permite salir cuando no hay cambios', async () => {
    expect(await confirmDiscardChanges()).toBe(true)
    expect(discardPrompt.value).toBeNull()
  })
  it('rechazar conserva la captura y aceptar autoriza la salida', async () => {
    const scope = effectScope()
    const dirty = ref(true)
    scope.run(() => useUnsavedChanges(() => dirty.value))
    const first = confirmDiscardChanges()
    expect(discardPrompt.value).toBe('dirty')
    answerDiscard(false)
    expect(await first).toBe(false)
    expect(hasPendingChanges()).toBe(true)
    const second = confirmDiscardChanges()
    answerDiscard(true)
    expect(await second).toBe(true)
    scope.stop()
    expect(hasPendingChanges()).toBe(false)
  })
  it('no permite abandonar un guardado en curso', async () => {
    const scope = effectScope()
    scope.run(() =>
      useUnsavedChanges(
        () => false,
        () => true,
      ),
    )
    const result = confirmDiscardChanges()
    expect(discardPrompt.value).toBe('busy')
    answerDiscard(true)
    expect(await result).toBe(false)
    scope.stop()
  })
  it('cerrar un editor limpio no descarta otro formulario modificado', async () => {
    const scope = effectScope()
    const clean = scope.run(() => {
      useUnsavedChanges(() => true)
      return useUnsavedChanges(() => false)
    })!
    expect(await clean.canDiscard()).toBe(true)
    expect(hasPendingChanges()).toBe(true)
    scope.stop()
  })
  it('deja de advertir tras guardar o desmontar', async () => {
    const scope = effectScope()
    const dirty = ref(true)
    scope.run(() => useUnsavedChanges(() => dirty.value))
    dirty.value = false
    expect(await confirmDiscardChanges()).toBe(true)
    scope.stop()
  })
})
