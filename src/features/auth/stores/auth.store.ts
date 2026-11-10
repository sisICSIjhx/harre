import type { User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/shared/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const roles = ref<string[]>([])
  let initialization: Promise<void> | null = null

  // Los roles se leen del backend; este estado solo adapta la interfaz.
  async function loadRoles() {
    if (!user.value) {
      roles.value = []
      return
    }
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(code), profiles!inner(is_active)')
      .eq('user_id', user.value.id)
      .eq('profiles.is_active', true)
    if (error) throw error
    roles.value = data.flatMap((row) => (row.roles ? [row.roles.code] : []))
  }

  async function initialize() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    await loadRoles()

    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user ?? null
      if (event === 'SIGNED_OUT') roles.value = []
    })
  }

  function ready(): Promise<void> {
    initialization ??= initialize().catch((error) => {
      initialization = null
      throw error
    })
    return initialization
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    await loadRoles()
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    roles.value = []
  }

  function hasAnyRole(allowed: string[]): boolean {
    return roles.value.some((role) => allowed.includes(role))
  }

  return { user, roles, ready, signIn, signOut, hasAnyRole }
})
