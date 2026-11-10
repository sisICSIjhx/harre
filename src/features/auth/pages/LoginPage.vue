<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { toFormSchema } from '@/shared/lib/form-schema'
import { useDesignMode } from '@/shared/design/design-mode'
const { isNext } = useDesignMode()

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const failure = ref('')

const { defineField, errors, handleSubmit, isSubmitting } = useForm({
  validationSchema: toFormSchema(
    z.object({
      email: z
        .string({ error: 'Escribe un correo válido' })
        .trim()
        .email('Escribe un correo válido'),
      password: z.string({ error: 'Escribe tu contraseña' }).min(1, 'Escribe tu contraseña'),
    }),
  ),
})
const [email] = defineField('email')
const [password] = defineField('password')

const submit = handleSubmit(async (values) => {
  failure.value = ''
  try {
    await auth.signIn(values.email, values.password)
    const redirect = route.query.redirect
    // Solo rutas internas: evita redirecciones abiertas.
    const internal = typeof redirect === 'string' && /^\/(?!\/)/.test(redirect)
    await router.push(internal ? redirect : '/')
  } catch {
    failure.value = 'No fue posible iniciar sesión. Revisa tus datos.'
  }
})
</script>

<template>
  <Card class="login-card">
    <template #title>{{ isNext ? 'Iniciar sesión' : 'ICSI RRHH' }}</template>
    <template #subtitle>Inicia sesión para continuar</template>
    <template #content>
      <form class="form-stack" novalidate @submit.prevent="submit">
        <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
        <div class="form-field">
          <label for="email">Correo</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            :invalid="!!errors.email"
            fluid
          />
          <small v-if="errors.email" class="form-error">{{ errors.email }}</small>
        </div>
        <div class="form-field">
          <label for="password">Contraseña</label>
          <Password
            v-model="password"
            input-id="password"
            :feedback="false"
            prompt-label="Escribe tu contraseña"
            toggle-mask
            autocomplete="current-password"
            :invalid="!!errors.password"
            fluid
          />
          <small v-if="errors.password" class="form-error">{{ errors.password }}</small>
        </div>
        <Button type="submit" label="Entrar" :loading="isSubmitting" fluid />
      </form>
    </template>
  </Card>
</template>

<style scoped>
.login-card {
  width: min(400px, 100%);
}
</style>
