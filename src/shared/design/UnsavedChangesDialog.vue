<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { answerDiscard, discardPrompt } from './unsaved-changes'
</script>
<template>
  <Dialog
    :visible="discardPrompt !== null"
    :header="discardPrompt === 'busy' ? 'Guardado en proceso' : 'Cambios sin guardar'"
    modal
    :base-z-index="3000"
    :style="{ width: 'min(460px, 94vw)' }"
    @update:visible="answerDiscard(false)"
  >
    <p>
      {{
        discardPrompt === 'busy'
          ? 'Espera a que termine el guardado antes de salir.'
          : 'Todavía no has guardado esta captura. Puedes seguir editando o descartar los cambios para continuar.'
      }}
    </p>
    <template #footer>
      <Button
        :label="discardPrompt === 'busy' ? 'Entendido' : 'Seguir editando'"
        severity="secondary"
        autofocus
        @click="answerDiscard(false)"
      />
      <Button
        v-if="discardPrompt === 'dirty'"
        label="Descartar cambios"
        severity="danger"
        @click="answerDiscard(true)"
      />
    </template>
  </Dialog>
</template>
