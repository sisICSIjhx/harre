import { readonly, ref, watchEffect } from 'vue'
import { useDesignMode } from './design-mode.js'

export const THEME_STORAGE_KEY = 'icsi-rrhh:theme:v1'
export type ThemeMode = 'light' | 'dark'
export function readTheme(storage?: Pick<Storage, 'getItem'>): ThemeMode {
  try {
    return (storage ?? window.localStorage).getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}
const theme = ref<ThemeMode>(readTheme())
const saved = ref(true)
const { isNext } = useDesignMode()
watchEffect(() => {
  const dark = isNext.value && theme.value === 'dark'
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('app-dark', dark)
  }
})
export function setTheme(value: ThemeMode) {
  theme.value = value
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value)
    saved.value = true
  } catch {
    saved.value = false
  }
}
export function useThemeMode() {
  return { theme: readonly(theme), saved: readonly(saved), setTheme }
}
