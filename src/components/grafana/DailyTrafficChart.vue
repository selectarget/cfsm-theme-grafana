<template>
  <div class="flex flex-col w-full h-full min-h-[160px] overflow-hidden">
    <div ref="chartRef" class="w-full h-full min-h-[160px]"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { formatBytes } from '../../utils/format';
import { t } from '../../utils/i18n';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export interface DailyTrafficItem {
  date: string;       // e.g. '09/15'
  rxBytes: number;    // Download bytes
  txBytes: number;    // Upload bytes
}

const props = defineProps<{
  items: DailyTrafficItem[];
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const dates = props.items.map(i => i.date);
  const rxData = props.items.map(i => parseFloat((i.rxBytes / (1024 * 1024 * 1024)).toFixed(2)));
  const txData = props.items.map(i => parseFloat((i.txBytes / (1024 * 1024 * 1024)).toFixed(2)));

  const option: echarts.EChartsCoreOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f2329',
      borderColor: '#343840',
      textStyle: { color: '#d8d9da', fontSize: 11, fontFamily: 'monospace' },
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const idx = params[0].dataIndex;
        const item = props.items[idx];
        const total = item.rxBytes + item.txBytes;
        return `<div class="p-1 space-y-1 font-sans">
          <div class="font-bold text-white border-b border-[#343840] pb-1 mb-1">${item.date} 消耗流量</div>
          <div class="flex justify-between space-x-4"><span style="color:#73BF69">● ${t('todayRx')}</span><b class="tabular-nums">${formatBytes(item.rxBytes)}</b></div>
          <div class="flex justify-between space-x-4"><span style="color:#5794F2">● ${t('todayTx')}</span><b class="tabular-nums">${formatBytes(item.txBytes)}</b></div>
          <div class="flex justify-between space-x-4 border-t border-[#343840] pt-1 mt-1 text-white"><span>合计:</span><b class="tabular-nums text-amber-300">${formatBytes(total)}</b></div>
        </div>`;
      }
    },
    legend: {
      show: true,
      top: 0,
      right: 10,
      textStyle: { color: '#8e8e99', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 8
    },
    grid: {
      top: 26,
      left: 10,
      right: 10,
      bottom: 20,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#2b2e35' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#767982',
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#767982',
        fontSize: 9,
        formatter: '{value} GB'
      },
      splitLine: {
        lineStyle: { color: '#1f2329', width: 1, type: 'dashed' }
      }
    },
    series: [
      {
        name: t('todayRx'),
        type: 'bar',
        stack: 'traffic',
        barMaxWidth: 24,
        itemStyle: {
          color: '#73BF69',
          borderRadius: [0, 0, 2, 2]
        },
        data: rxData
      },
      {
        name: t('todayTx'),
        type: 'bar',
        stack: 'traffic',
        barMaxWidth: 24,
        itemStyle: {
          color: '#5794F2',
          borderRadius: [2, 2, 0, 0]
        },
        data: txData
      }
    ]
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

watch(() => props.items, () => {
  renderChart();
}, { deep: true });
</script>
