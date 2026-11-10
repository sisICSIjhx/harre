<script setup lang="ts">
import { computed } from 'vue'
import type { MonthMovement } from '../dashboard-metrics'

const props = defineProps<{ months: MonthMovement[] }>()

const WIDTH = 560
const HEIGHT = 220
const PLOT = { left: 32, right: 8, top: 12, bottom: 28 }
const BAR = 14

const max = computed(() => {
  const highest = Math.max(1, ...props.months.flatMap((month) => [month.hires, month.terminations]))
  // Escala entera con cuatro divisiones.
  return Math.ceil(highest / 4) * 4
})
const ticks = computed(() => [0, 1, 2, 3, 4].map((step) => (max.value / 4) * step))
const plotHeight = HEIGHT - PLOT.top - PLOT.bottom
const slot = computed(() => (WIDTH - PLOT.left - PLOT.right) / Math.max(props.months.length, 1))

function y(value: number) {
  return PLOT.top + plotHeight - (value / max.value) * plotHeight
}
function x(index: number) {
  return PLOT.left + slot.value * index + slot.value / 2
}
</script>

<template>
  <div class="movements">
    <ul class="movements-legend" aria-hidden="true">
      <li><span class="swatch hires" />Altas</li>
      <li><span class="swatch terminations" />Bajas</li>
    </ul>
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" aria-hidden="true">
      <g v-for="tick in ticks" :key="tick">
        <line :x1="PLOT.left" :x2="WIDTH - PLOT.right" :y1="y(tick)" :y2="y(tick)" class="grid" />
        <text :x="PLOT.left - 8" :y="y(tick) + 4" class="axis axis-y">{{ tick }}</text>
      </g>
      <g v-for="(month, index) in months" :key="month.key">
        <rect
          :x="x(index) - BAR - 2"
          :y="y(month.hires)"
          :width="BAR"
          :height="y(0) - y(month.hires)"
          rx="4"
          class="hires"
        />
        <rect
          :x="x(index) + 2"
          :y="y(month.terminations)"
          :width="BAR"
          :height="y(0) - y(month.terminations)"
          rx="4"
          class="terminations"
        />
        <text :x="x(index)" :y="HEIGHT - 8" class="axis">{{ month.label }}</text>
      </g>
    </svg>
    <table class="dashboard-sr-only">
      <caption>
        Altas y bajas por mes
      </caption>
      <thead>
        <tr>
          <th scope="col">Mes</th>
          <th scope="col">Altas</th>
          <th scope="col">Bajas</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="month in months" :key="month.key">
          <th scope="row">{{ month.label }}</th>
          <td>{{ month.hires }}</td>
          <td>{{ month.terminations }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.movements {
  display: grid;
  gap: 0.75rem;
}

svg {
  width: 100%;
  height: auto;
}

.movements-legend {
  display: flex;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.85rem;
}

.movements-legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.grid {
  stroke: var(--app-border);
}

.axis {
  font-size: 11px;
  fill: var(--app-muted);
  text-anchor: middle;
  text-transform: capitalize;
}

.axis-y {
  text-anchor: end;
}

.hires {
  fill: #0e7f52;
  background: #0e7f52;
}

.terminations {
  fill: #d97706;
  background: #d97706;
}

.dashboard-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
