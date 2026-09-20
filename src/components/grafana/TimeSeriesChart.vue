<template>
  <div class="flex flex-col md:flex-row w-full h-full min-h-[160px] overflow-hidden">
    <!-- Chart Canvas -->
    <div ref="chartRef" class="flex-1 min-h-[140px] w-full"></div>

    <!-- Grafana-style Series Legend Table (Optional right-side list) -->
    <div
      v-if="showLegendTable && seriesList.length"
      class="w-full md:w-44 border-t md:border-t-0 md:border-l border-[#22252a] pl-2.5 pt-2 md:pt-0 flex flex-col justify-start overflow-y-auto max-h-[160px] text-[11px]"
    >
      <div class="flex items-center justify-between text-[10px] text-grafana-muted uppercase pb-1 border-b border-[#22252a] font-semibold">
        <span>Name</span>
        <span class="tabular-nums">Last</span>
      </div>
      <div class="space-y-1 mt-1">
        <div
          v-for="(item, idx) in seriesList"
          :key="idx"
          class="flex items-center justify-between text-grafana-text hover:text-white cursor-pointer py-0.5"
        >
          <div class="flex items-center space-x-1.5 truncate max-w-[100px]">
            <span class="w-2 h-0.5 flex-shrink-0" :style="{ backgroundColor: item.color }"></span>
            <span class="truncate text-[10px]" :title="item.name">{{ item.name }}</span>
          </div>
          <span class="tabular-nums font-medium text-[11px]" :style="{ color: item.color }">
            {{ item.lastValue !== undefined ? item.lastValue : '-' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export interface SeriesConfig {
  name: string;
  data: number[] | [number, number][]; // timestamp or value array
  color: string;
  fillOpacity?: number;
  lastValue?: string | number;
  unit?: string;
  isNegative?: boolean; // 用于负轴镜像
}

const props = withDefaults(
  defineProps<{
    timestamps?: number[] | string[];
    seriesList: SeriesConfig[];
    showLegendTable?: boolean;
    yAxisFormatter?: (val: number) => string;
    unit?: string;
    min?: number | string;
    max?: number | string;
  }>(),
  {
    timestamps: () => [],
    showLegendTable: false,
    unit: ''
  }
);

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const series = props.seriesList.map(s => {
    return {
      name: s.name,
      type: 'line',
      smooth: 0.25,
      showSymbol: false,
      lineStyle: {
        width: 1.5,
        color: s.color
      },
      itemStyle: {
        color: s.color
      },
      areaStyle: s.fillOpacity ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${s.color}${Math.round(s.fillOpacity * 255).toString(16).padStart(2, '0')}` },
          { offset: 1, color: `${s.color}05` }
        ])
      } : undefined,
      data: s.data
    };
  });

  const option: echarts.EChartsCoreOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f2329',
      borderColor: '#343840',
      textStyle: { color: '#d8d9da', fontSize: 11, fontFamily: 'monospace' },
      axisPointer: {
        type: 'cross',
        lineStyle: { color: '#555963', width: 1, type: 'dashed' },
        crossStyle: { color: '#555963' }
      },
      valueFormatter: (value: any) => {
        if (value === undefined || value === null) return '-';
        if (props.yAxisFormatter) return props.yAxisFormatter(Number(value));
        return `${value} ${props.unit}`.trim();
      }
    },
    grid: {
      top: 12,
      left: 36,
      right: 12,
      bottom: 22,
      containLabel: true
    },
    xAxis: {
      type: props.timestamps.length > 0 ? 'category' : 'time',
      data: props.timestamps.length > 0 ? props.timestamps : undefined,
      axisLine: { lineStyle: { color: '#2b2e35' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#767982',
        fontSize: 10,
        formatter: (val: any) => {
          if (typeof val === 'number') {
            const d = new Date(val);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          }
          return val;
        }
      },
      splitLine: {
        show: true,
        lineStyle: { color: '#1a1d22', width: 1 }
      }
    },
    yAxis: {
      type: 'value',
      min: props.min,
      max: props.max,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#767982',
        fontSize: 10,
        formatter: (val: number) => {
          if (props.yAxisFormatter) return props.yAxisFormatter(val);
          return `${val}`;
        }
      },
      splitLine: {
        lineStyle: { color: '#1f2329', width: 1, type: 'dashed' }
      }
    },
    series: series as any
  };

  chartInstance.setOption(option, true);
};

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  renderChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});

watch(() => [props.seriesList, props.timestamps], () => {
  renderChart();
}, { deep: true });
</script>
