<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  segments: { label: string; value: number; color: string }[]
  caption: string
}>()

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
// Separación entre segmentos, en unidades del trazo.
const GAP = 3

const total = computed(() => props.segments.reduce((sum, segment) => sum + segment.value, 0))
const arcs = computed(() => {
  const visible = props.segments.filter((segment) => segment.value > 0)
  const gap = visible.length > 1 ? GAP : 0
  let offset = 0
  return visible.map((segment) => {
    const length = (segment.value / total.value) * CIRCUMFERENCE
    const arc = {
      color: segment.color,
      dash: `${Math.max(length - gap, 0)} ${CIRCUMFERENCE}`,
      offset: -offset,
    }
    offset += length
    return arc
  })
})
</script>

<template>
  <div class="donut">
    <!-- La leyenda con cifras es la alternativa textual del gráfico. -->
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <circle class="donut-track" cx="70" cy="70" :r="RADIUS" />
      <circle
        v-for="(arc, index) in arcs"
        :key="index"
        cx="70"
        cy="70"
        :r="RADIUS"
        :stroke="arc.color"
        :stroke-dasharray="arc.dash"
        :stroke-dashoffset="arc.offset"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="68" class="donut-total">{{ total.toLocaleString('es-MX') }}</text>
      <text x="70" y="88" class="donut-caption">{{ caption }}</text>
    </svg>
    <ul class="donut-legend">
      <li v-for="segment in segments" :key="segment.label">
        <span class="donut-swatch" :style="{ background: segment.color }" aria-hidden="true" />
        <span>{{ segment.label }}</span>
        <strong>{{ segment.value.toLocaleString('es-MX') }}</strong>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.donut {
  display: grid;
  gap: 1.25rem;
}

svg {
  width: min(180px, 100%);
  justify-self: center;
}

circle {
  fill: none;
  stroke-width: 16;
}

.donut-track {
  stroke: var(--app-border);
}

.donut-total {
  text-anchor: middle;
  font-size: 24px;
  font-weight: 700;
  fill: var(--app-text);
}

.donut-caption {
  text-anchor: middle;
  font-size: 10px;
  fill: var(--app-muted);
}

.donut-legend {
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.donut-legend li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.donut-legend strong {
  margin-left: auto;
}

.donut-swatch {
  flex: 0 0 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
