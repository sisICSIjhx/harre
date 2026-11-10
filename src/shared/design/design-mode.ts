import { computed, readonly, ref } from 'vue'

export type DesignMode = 'current' | 'next'
export const DESIGN_STORAGE_KEY = 'icsi-rrhh:design:v1'

export function parseDesignMode(value: unknown): DesignMode {
  return value === 'next' ? 'next' : 'current'
}

export function readDesignMode(storage?: Pick<Storage, 'getItem'>): DesignMode {
  try {
    return parseDesignMode((storage ?? window.localStorage).getItem(DESIGN_STORAGE_KEY))
  } catch {
    return 'current'
  }
}

const mode = ref<DesignMode>(readDesignMode())
const storageAvailable = ref(true)
const isNext = computed(() => mode.value === 'next')

function applyMode() {
  if (typeof document !== 'undefined') document.documentElement.dataset.design = mode.value
}
applyMode()

export function setDesignMode(value: DesignMode) {
  mode.value = parseDesignMode(value)
  applyMode()
  try {
    window.localStorage.setItem(DESIGN_STORAGE_KEY, mode.value)
    storageAvailable.value = true
  } catch {
    storageAvailable.value = false
  }
}

export function useDesignMode() {
  return {
    mode: readonly(mode),
    isNext,
    storageAvailable: readonly(storageAvailable),
    setDesignMode,
  }
}
