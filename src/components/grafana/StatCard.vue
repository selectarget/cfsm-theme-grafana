<template>
  <div class="flex flex-col justify-center items-center w-full h-full py-1">
    <!-- Subtitle or Label -->
    <div v-if="label" class="text-xs text-grafana-muted mb-1 font-medium tracking-wide">
      {{ label }}
    </div>

    <!-- Big Stat Value -->
    <div class="flex items-baseline space-x-1 tabular-nums">
      <span
        class="font-bold tracking-tight"
        :class="[
          sizeClass,
          colorClass,
          glow ? glowClass : ''
        ]"
      >
        {{ value }}
      </span>
      <span v-if="unit" class="text-xs md:text-sm font-semibold opacity-75" :class="colorClass">
        {{ unit }}
      </span>
    </div>

    <!-- Secondary Meta / Sub-stats Grid (e.g., Latency TCAS/TRCD or extra metrics) -->
    <div v-if="subStats && subStats.length" class="grid grid-cols-4 gap-2 mt-3 w-full border-t border-[#22252a] pt-2 text-center">
      <div v-for="(sub, idx) in subStats" :key="idx" class="flex flex-col">
        <span class="text-[10px] text-grafana-muted uppercase">{{ sub.label }}</span>
        <span class="text-xs font-semibold tabular-nums text-grafana-blue">{{ sub.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    value: string | number;
    unit?: string;
    label?: string;
    color?: 'green' | 'blue' | 'yellow' | 'orange' | 'red' | 'cyan' | 'purple' | 'white';
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    glow?: boolean;
    subStats?: Array<{ label: string; value: string | number }>;
  }>(),
  {
    unit: '',
    label: '',
    color: 'green',
    size: 'xl',
    glow: false,
    subStats: () => []
  }
);

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-xl md:text-2xl';
    case 'md': return 'text-2xl md:text-3xl';
    case 'lg': return 'text-3xl md:text-4xl';
    case '2xl': return 'text-4xl md:text-6xl';
    case 'xl':
    default: return 'text-3xl md:text-5xl';
  }
});

const colorClass = computed(() => {
  switch (props.color) {
    case 'blue': return 'text-grafana-blue';
    case 'yellow': return 'text-grafana-yellow';
    case 'orange': return 'text-grafana-orange';
    case 'red': return 'text-grafana-red';
    case 'cyan': return 'text-grafana-cyan';
    case 'purple': return 'text-grafana-purple';
    case 'white': return 'text-white';
    case 'green':
    default: return 'text-grafana-green';
  }
});

const glowClass = computed(() => {
  switch (props.color) {
    case 'blue': return 'glow-blue';
    case 'orange': return 'glow-orange';
    case 'red': return 'glow-red';
    case 'green':
    default: return 'glow-green';
  }
});
</script>
