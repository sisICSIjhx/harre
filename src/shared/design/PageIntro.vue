<script setup lang="ts">
import { useDesignMode } from './design-mode'
defineProps<{ text: string; eyebrow?: string }>()
const { isNext } = useDesignMode()
</script>
<template>
  <div v-if="isNext" class="next-page-intro">
    <span v-if="eyebrow" class="next-eyebrow">{{ eyebrow }}</span>
    <p>{{ text }}</p>
  </div>
</template>
