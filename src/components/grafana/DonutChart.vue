<template>
  <div class="flex items-center justify-between w-full h-full min-h-[140px]">
    <!-- Chart Container -->
    <div ref="chartRef" class="w-1/2 h-full min-h-[140px]"></div>

    <!-- Legend List -->
    <div class="w-1/2 pl-2 flex flex-col justify-center space-y-1.5 text-xs">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="flex items-center justify-between pr-2 text-grafana-text hover:text-white transition-colors"
      >
        <div class="flex items-center space-x-2 truncate">
          <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: item.color }"></span>
          <span class="truncate text-[11px]">{{ item.name }}</span>
        </div>
        <span class="tabular-nums font-semibold text-[11px] ml-2" :style="{ color: item.color }">
          {{ item.percent }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([PieChart, TooltipComponent, CanvasRenderer]);

export interface DonutItem {
  name: string;
  value: number;
  formatted?: string;
  percent: number | string;
  color: string;
}

const props = defineProps<{
  items: DonutItem[];
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const seriesData = props.items.map(item => ({
    name: item.name,
    value: item.value,
    itemStyle: { color: item.color }
  }));

  const option: echarts.EChartsCoreOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1f2329',
      borderColor: '#343840',
      textStyle: { color: '#e0e0e0', fontSize: 11 },
      formatter: (params: any) => {
        const item = props.items.find(i => i.name === params.name);
        return `<div class="font-sans">
          <span style="display:inline-block;margin-right:4px;border-radius:10px;width:8px;height:8px;background-color:${params.color};"></span>
          <b>${params.name}</b>: ${item?.formatted || params.value} (${params.percent}%)
        </div>`;
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            const item = props.items.find(i => i.name === params.name);
            return item?.formatted || `${params.percent}%`;
          },
          fontSize: 9,
          color: '#ffffff',
          fontWeight: 'bold'
        },
        labelLine: { show: false },
        data: seriesData
      }
    ]
  };

  chartInstance.setOption(option);
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

watch(() => props.items, () => {
  renderChart();
}, { deep: true });
</script>
