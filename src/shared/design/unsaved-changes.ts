import { onScopeDispose, ref } from 'vue'

type PendingEditor = { dirty: () => boolean; busy: () => boolean }
const editors = new Set<PendingEditor>()
export interface FormHandle {
  canDiscard: () => Promise<boolean>
  markSaved: () => void
}
export const discardPrompt = ref<'dirty' | 'busy' | null>(null)
let pending: Promise<boolean> | null = null
let resolvePrompt: ((answer: boolean) => void) | undefined

function askDiscard(busy: boolean): Promise<boolean> {
  if (pending) return pending
  discardPrompt.value = busy ? 'busy' : 'dirty'
  pending = new Promise<boolean>((resolve) => {
    resolvePrompt = resolve
  })
  return pending
}

export function answerDiscard(answer: boolean) {
  const resolve = resolvePrompt
  const allowed = discardPrompt.value === 'dirty' && answer
  discardPrompt.value = null
  pending = null
  resolvePrompt = undefined
  resolve?.(allowed)
}

export function releasePendingChanges() {
  editors.clear()
}

export function hasPendingChanges() {
  return [...editors].some((editor) => editor.dirty() || editor.busy())
}

export function confirmDiscardChanges() {
  if (!hasPendingChanges()) return Promise.resolve(true)
  return askDiscard([...editors].some((editor) => editor.busy()))
}

export function useUnsavedChanges(dirty: () => boolean, busy: () => boolean = () => false) {
  const editor = { dirty, busy }
  editors.add(editor)
  onScopeDispose(() => editors.delete(editor))
  function canDiscard() {
    return !dirty() && !busy() ? Promise.resolve(true) : askDiscard(busy())
  }
  return { canDiscard }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (event) => {
    if (!hasPendingChanges()) return
    event.preventDefault()
    event.returnValue = ''
  })
}
