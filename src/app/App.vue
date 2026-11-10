<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import UnsavedChangesDialog from '@/shared/design/UnsavedChangesDialog.vue'
</script>

<template>
  <Toast />
  <ConfirmDialog />
  <UnsavedChangesDialog />
  <RouterView />
</template>
