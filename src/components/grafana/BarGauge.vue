<template>
  <div
    v-if="orientation === 'horizontal'"
    class="flex flex-col space-y-2 w-full h-full justify-center"
  >
    <div
      v-for="(bar, idx) in bars"
      :key="idx"
      class="flex items-center space-x-2 text-xs"
    >
      <span class="w-14 truncate text-grafana-muted font-medium text-[11px]">{{ bar.label }}</span>
      <!-- Bar Track -->
      <div class="flex-1 h-3.5 bg-[#121316] rounded-sm overflow-hidden p-0.5 border border-[#22252a]">
        <div
          class="h-full rounded-sm transition-all duration-500 ease-out"
          :style="{
            width: `${Math.min(100, Math.max(0, bar.percent))}%`,
            background: bar.color || getThresholdColor(bar.percent)
          }"
        ></div>
      </div>
      <span class="w-14 text-right tabular-nums font-semibold text-[11px] text-grafana-blue">
        {{ bar.valueFormatted || `${bar.percent}%` }}
      </span>
    </div>
  </div>

  <!-- Vertical Mode (e.g. Partition Usage or Vertical CPU Cores) -->
  <div
    v-else
    class="flex items-end justify-around w-full h-full pt-4 pb-1 space-x-1"
  >
    <div
      v-for="(bar, idx) in bars"
      :key="idx"
      class="flex-1 flex flex-col items-center h-full max-w-[48px]"
    >
      <!-- Top Value -->
      <span class="text-[10px] tabular-nums font-semibold mb-1" :style="{ color: bar.color || getThresholdColor(bar.percent) }">
        {{ bar.valueFormatted || `${bar.percent}%` }}
      </span>

      <!-- Vertical Track -->
      <div class="flex-1 w-full bg-[#131518] rounded-sm border border-[#22252a] p-0.5 flex flex-col justify-end overflow-hidden">
        <div
          class="w-full rounded-sm transition-all duration-500 ease-out opacity-80 hover:opacity-100"
          :style="{
            height: `${Math.min(100, Math.max(0, bar.percent))}%`,
            background: bar.color || getThresholdColor(bar.percent)
          }"
        ></div>
      </div>

      <!-- Bottom Label -->
      <span class="text-[9px] text-grafana-muted truncate mt-1 text-center w-full" :title="bar.label">
        {{ bar.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface BarItem {
  label: string;
  percent: number;
  valueFormatted?: string;
  color?: string;
}

withDefaults(
  defineProps<{
    bars: BarItem[];
    orientation?: 'horizontal' | 'vertical';
  }>(),
  {
    orientation: 'horizontal'
  }
);

const getThresholdColor = (pct: number) => {
  if (pct >= 90) return '#F2495C'; // Red
  if (pct >= 75) return '#FF9830'; // Orange
  if (pct >= 50) return '#FADE2A'; // Yellow
  if (pct >= 25) return '#5794F2'; // Blue
  return '#73BF69'; // Green
};
</script>
