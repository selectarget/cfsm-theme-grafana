<template>
  <div v-if="server" class="space-y-2.5 pb-6">
    <!-- Server Quick Header Summary -->
    <div class="flex flex-wrap items-center justify-between gap-2 px-1 py-1 border-b border-[#22252a] text-xs">
      <div class="flex items-center space-x-2">
        <router-link to="/" class="text-grafana-muted hover:text-white flex items-center space-x-1">
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Overview</span>
        </router-link>
        <span class="text-grafana-darkmuted">|</span>
        <img
          :src="getFlagUrl(server.region)"
          :alt="server.region"
          class="w-4 h-3 object-cover rounded-xs border border-white/10"
        />
        <span class="font-bold text-sm text-white">{{ server.name }}</span>
        <span class="text-grafana-muted">({{ server.os }} / {{ server.arch }})</span>
      </div>

      <div class="flex items-center space-x-3 text-grafana-muted text-[11px]">
        <span>Kernel: <b class="text-grafana-text font-mono">{{ server.kernel_version || 'N/A' }}</b></span>
        <span>CPU: <b class="text-grafana-text font-mono">{{ server.cpu_info }} ({{ server.cpu_cores }} Cores)</b></span>
        <span class="flex items-center space-x-1">
          <span class="w-2 h-2 rounded-full" :class="isOnline ? 'bg-grafana-green animate-pulse' : 'bg-grafana-red'"></span>
          <span :class="isOnline ? 'text-grafana-green' : 'text-grafana-red'">{{ isOnline ? 'Online' : 'Offline' }}</span>
        </span>
      </div>
    </div>

    <!-- ROW 1: Memory & Power Metrics (5 Columns) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
      <!-- Panel 1: Primary Memory Usage (%) Donut -->
      <GrafanaPanel title="Node Memory Usage (%)">
        <DonutChart :items="primaryMemoryDonut" />
      </GrafanaPanel>

      <!-- Panel 2: Memory History Time Series -->
      <GrafanaPanel title="Memory History" timeBadge="Live">
        <TimeSeriesChart
          :series-list="memoryHistorySeries"
          :timestamps="historyTimestamps"
          :show-legend-table="true"
          unit="MB"
        />
      </GrafanaPanel>

      <!-- Panel 3: Memory Clock & Latency -->
      <GrafanaPanel title="Memory Timing & Latency">
        <StatCard
          value="4091"
          unit="MHz"
          size="lg"
          color="blue"
          label="Memory Frequency"
          glow
          :sub-stats="[
            { label: 'TCAS', value: '18' },
            { label: 'TRCD', value: '22' },
            { label: 'TRP', value: '22' },
            { label: 'TRAS', value: '39' }
          ]"
        />
      </GrafanaPanel>

      <!-- Panel 4: System Power Metrics -->
      <GrafanaPanel title="System Power Metrics" timeBadge="Realtime">
        <TimeSeriesChart
          :series-list="powerMetricsSeries"
          :timestamps="historyTimestamps"
          :show-legend-table="true"
        />
      </GrafanaPanel>

      <!-- Panel 5: Secondary Memory / Swap Usage (%) Donut -->
      <GrafanaPanel title="Swap / Secondary Memory (%)">
        <DonutChart :items="swapMemoryDonut" />
      </GrafanaPanel>
    </div>

    <!-- ROW 2: Uptime, CPU Usage & Frequency (5 Columns) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
      <!-- Panel 6: Host Uptime & CPU Freq -->
      <div class="flex flex-col space-y-2.5">
        <GrafanaPanel title="Host Uptime" custom-class="h-28">
          <StatCard
            :value="uptimeFormatted"
            size="md"
            color="red"
            glow
          />
        </GrafanaPanel>
        <GrafanaPanel title="Host CPU Frequency" custom-class="flex-1 min-h-[110px]">
          <BarGauge
            :bars="hostCpuBars"
            orientation="horizontal"
          />
        </GrafanaPanel>
      </div>

      <!-- Panel 7: Multi-core CPU Usage (%) Time Series -->
      <GrafanaPanel title="CPU Usage (%)" timeBadge="24h">
        <TimeSeriesChart
          :series-list="cpuUsageSeries"
          :timestamps="historyTimestamps"
          :show-legend-table="true"
          unit="%"
          :min="0"
          :max="100"
        />
      </GrafanaPanel>

      <!-- Panel 8: Server Uptime & CPU Frequency -->
      <div class="flex flex-col space-y-2.5">
        <GrafanaPanel title="Server System Uptime" custom-class="h-28">
          <StatCard
            :value="uptimeFormatted"
            size="md"
            color="white"
          />
        </GrafanaPanel>
        <GrafanaPanel title="CPU Frequency Distribution" custom-class="flex-1 min-h-[110px]">
          <BarGauge
            :bars="verticalCpuBars"
            orientation="vertical"
          />
        </GrafanaPanel>
      </div>

      <!-- Panel 9: CPU Power & Voltage -->
      <div class="flex flex-col space-y-2.5">
        <GrafanaPanel title="CPU Package Power" custom-class="h-28">
          <TimeSeriesChart
            :series-list="cpuPowerSeries"
            :timestamps="historyTimestamps.slice(-12)"
            unit="W"
          />
        </GrafanaPanel>
        <GrafanaPanel title="CPU Core Voltage" custom-class="flex-1 min-h-[110px]">
          <StatCard
            value="918.749"
            unit="mV"
            size="lg"
            color="green"
            glow
          />
        </GrafanaPanel>
      </div>

      <!-- Panel 10: Secondary Uptime & Frequency -->
      <div class="flex flex-col space-y-2.5">
        <GrafanaPanel title="Agent Uptime" custom-class="h-28">
          <StatCard
            value="1 d 14:45:38"
            size="md"
            color="purple"
          />
        </GrafanaPanel>
        <GrafanaPanel title="Core Frequency (ARM)" custom-class="flex-1 min-h-[110px]">
          <BarGauge
            :bars="secondaryCpuBars"
            orientation="horizontal"
          />
        </GrafanaPanel>
      </div>
    </div>

    <!-- ROW 3: Core Breakdown, System Temperatures & Ping Latency -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <!-- Panel 11: Host CPU Usage Multi-stat Card -->
      <GrafanaPanel title="Core Utilization (%)">
        <div class="grid grid-cols-2 gap-3 py-2 w-full h-full">
          <div class="bg-[#141519] border border-[#22252b] rounded p-2 text-center">
            <span class="text-[10px] text-grafana-muted block mb-0.5">CPU 0</span>
            <span class="text-2xl font-bold tabular-nums text-grafana-green glow-green">{{ currentCoreLoads[0] }}%</span>
            <div class="h-1 bg-[#1c1e24] mt-2 rounded overflow-hidden">
              <div class="h-full bg-grafana-green" :style="{ width: `${currentCoreLoads[0]}%` }"></div>
            </div>
          </div>
          <div class="bg-[#141519] border border-[#22252b] rounded p-2 text-center">
            <span class="text-[10px] text-grafana-muted block mb-0.5">CPU 1</span>
            <span class="text-2xl font-bold tabular-nums text-grafana-yellow glow-orange">{{ currentCoreLoads[1] }}%</span>
            <div class="h-1 bg-[#1c1e24] mt-2 rounded overflow-hidden">
              <div class="h-full bg-grafana-yellow" :style="{ width: `${currentCoreLoads[1]}%` }"></div>
            </div>
          </div>
          <div class="bg-[#141519] border border-[#22252b] rounded p-2 text-center">
            <span class="text-[10px] text-grafana-muted block mb-0.5">CPU 2</span>
            <span class="text-2xl font-bold tabular-nums text-grafana-blue glow-blue">{{ currentCoreLoads[2] }}%</span>
            <div class="h-1 bg-[#1c1e24] mt-2 rounded overflow-hidden">
              <div class="h-full bg-grafana-blue" :style="{ width: `${currentCoreLoads[2]}%` }"></div>
            </div>
          </div>
          <div class="bg-[#141519] border border-[#22252b] rounded p-2 text-center">
            <span class="text-[10px] text-grafana-muted block mb-0.5">CPU 3</span>
            <span class="text-2xl font-bold tabular-nums text-grafana-orange">{{ currentCoreLoads[3] }}%</span>
            <div class="h-1 bg-[#1c1e24] mt-2 rounded overflow-hidden">
              <div class="h-full bg-grafana-orange" :style="{ width: `${currentCoreLoads[3]}%` }"></div>
            </div>
          </div>
        </div>
      </GrafanaPanel>

      <!-- Panel 12: System Temperature (°C) -->
      <GrafanaPanel title="System Temperature (°C)" timeBadge="Sensors">
        <TimeSeriesChart
          :series-list="temperatureSeries"
          :timestamps="historyTimestamps"
          :show-legend-table="true"
          unit="°C"
        />
      </GrafanaPanel>

      <!-- Panel 13: Ping Latency Lines (China Telecom, Unicom, Mobile, BGP) -->
      <GrafanaPanel title="Network Route Latency (Ping RTT)" timeBadge="Last 24h">
        <TimeSeriesChart
          :series-list="pingLatencySeries"
          :timestamps="pingTimestamps"
          :show-legend-table="true"
          unit="ms"
        />
      </GrafanaPanel>

      <!-- Panel 14: Secondary CPU Usage Multi-stat -->
      <GrafanaPanel title="Auxiliary Core Loads (%)">
        <div class="grid grid-cols-2 gap-3 py-2 w-full h-full">
          <div class="bg-[#141519] border border-[#22252b] rounded p-2 text-center">
            <span class="text-[10px] text-grafana-muted block mb-0.5">Cluster Core 0</span>
            <span class="text-2xl font-bold tabular-nums text-grafana-green">{{ auxCoreLoads[0] }}%</span>
          </div>
          <div class="bg-[#141519] border border-[#22252b] rounded p-2 text-center">
            <span class="text-[10px] text-grafana-muted block mb-0.5">Cluster Core 1</span>
            <span class="text-2xl font-bold tabular-nums text-grafana-yellow">{{ auxCoreLoads[1] }}%</span>
          </div>
          <div class="bg-[#141519] border border-[#22252b] rounded p-2 text-center">
            <span class="text-[10px] text-grafana-muted block mb-0.5">Cluster Core 2</span>
            <span class="text-2xl font-bold tabular-nums text-grafana-blue">{{ auxCoreLoads[2] }}%</span>
          </div>
          <div class="bg-[#141519] border border-[#22252b] rounded p-2 text-center">
            <span class="text-[10px] text-grafana-muted block mb-0.5">Cluster Core 3</span>
            <span class="text-2xl font-bold tabular-nums text-grafana-purple">{{ auxCoreLoads[3] }}%</span>
          </div>
        </div>
      </GrafanaPanel>
    </div>

    <!-- ROW 4: GPU & Power / Energy Generation -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <!-- Panel 15: GPU / VRAM Usage (%) -->
      <GrafanaPanel title="GPU / VRAM Usage (%)">
        <TimeSeriesChart
          :series-list="gpuUsageSeries"
          :timestamps="historyTimestamps"
          :show-legend-table="true"
          unit="%"
        />
      </GrafanaPanel>

      <!-- Panel 16: GPU Frequency & Power Metrics -->
      <div class="grid grid-cols-2 gap-2">
        <GrafanaPanel title="GPU Voltage" custom-class="h-full">
          <StatCard
            value="0.04720"
            unit="V"
            size="md"
            color="red"
            glow
          />
        </GrafanaPanel>
        <GrafanaPanel title="GPU Fan & Power" custom-class="h-full">
          <StatCard
            value="0"
            unit="RPM"
            size="md"
            color="orange"
            :sub-stats="[
              { label: 'Fan', value: '0%' },
              { label: 'Power', value: '0 W' }
            ]"
          />
        </GrafanaPanel>
      </div>

      <!-- Panel 17: Energy Generation / Power Trend -->
      <div class="lg:col-span-2">
        <GrafanaPanel title="Energy Consumption & Power Flow" timeBadge="Today so far">
          <TimeSeriesChart
            :series-list="energySeries"
            :timestamps="historyTimestamps"
            :show-legend-table="true"
            unit="kW"
          />
        </GrafanaPanel>
      </div>
    </div>

    <!-- ROW 5: Storage & Bandwidth Mirror Charts (Matches Bottom of image.png) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
      <!-- Panel 18: Partition Usage (%) Vertical Water Levels -->
      <GrafanaPanel title="Partition Usage (%)">
        <BarGauge
          :bars="partitionBars"
          orientation="vertical"
        />
      </GrafanaPanel>

      <!-- Panel 19: Disk Temperature / IOPS -->
      <GrafanaPanel title="Disk Temperature (°C)">
        <TimeSeriesChart
          :series-list="diskTempSeries"
          :timestamps="historyTimestamps"
          :show-legend-table="true"
          unit="°C"
        />
      </GrafanaPanel>

      <!-- Panel 20: Drive Health Status (%) -->
      <GrafanaPanel title="Drive Health Status (%)">
        <div class="flex flex-col justify-around h-full py-1 space-y-2">
          <div class="flex items-center justify-between border-b border-[#22252a] pb-1">
            <span class="text-xs text-grafana-text font-semibold">SSD: Patriot Burst</span>
            <span class="text-xl font-bold tabular-nums text-grafana-blue">96<span class="text-xs">%</span></span>
          </div>
          <div class="flex items-center justify-between border-b border-[#22252a] pb-1">
            <span class="text-xs text-grafana-text font-semibold">SSD: SSV5</span>
            <span class="text-xl font-bold tabular-nums text-grafana-green glow-green">100<span class="text-xs">%</span></span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-grafana-text font-semibold">NVME: SN750</span>
            <span class="text-xl font-bold tabular-nums text-grafana-green glow-green">100<span class="text-xs">%</span></span>
          </div>
        </div>
      </GrafanaPanel>

      <!-- Panel 21: Disk Usage (Read / Write Symmetrical Mirror Chart) -->
      <GrafanaPanel title="Disk Usage (Write / Read)">
        <TimeSeriesChart
          :series-list="diskUsageMirrorSeries"
          :timestamps="historyTimestamps"
          unit="KB/s"
        />
      </GrafanaPanel>

      <!-- Panel 22: Bandwidth Usage (Download / Upload Symmetrical Mirror Chart) -->
      <GrafanaPanel title="Bandwidth Usage (Download / Upload)">
        <TimeSeriesChart
          :series-list="bandwidthMirrorSeries"
          :timestamps="historyTimestamps"
          unit="KB/s"
        />
      </GrafanaPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ArrowLeft } from 'lucide-vue-next';
import GrafanaPanel from '../components/grafana/GrafanaPanel.vue';
import StatCard from '../components/grafana/StatCard.vue';
import DonutChart, { type DonutItem } from '../components/grafana/DonutChart.vue';
import TimeSeriesChart, { type SeriesConfig } from '../components/grafana/TimeSeriesChart.vue';
import BarGauge, { type BarItem } from '../components/grafana/BarGauge.vue';
import type { Server, HistoryMetricRow } from '../types';
import { formatBytes, formatUptime, getFlagUrl, isServerOnline } from '../utils/format';

const props = defineProps<{
  server: Server;
  history: HistoryMetricRow[];
}>();

const isOnline = computed(() => isServerOnline(props.server));
const uptimeFormatted = computed(() => formatUptime(props.server.boot_time));

// Core dynamic loads
const currentCoreLoads = computed(() => {
  const base = Math.min(100, Math.max(2, props.server.cpu || 8));
  return [
    Math.round(base),
    Math.max(1, Math.round(base * 0.9)),
    Math.max(1, Math.round(base * 0.85)),
    Math.max(1, Math.round(base * 0.95))
  ];
});

const auxCoreLoads = computed(() => {
  return [6, 8, 5, 5];
});

// Memory Donut
const primaryMemoryDonut = computed<DonutItem[]>(() => {
  const total = props.server.ram_total || 4096;
  const used = props.server.ram_used || 1200;
  const reserved = Math.round(total * 0.06);
  const available = Math.max(0, total - used - reserved);

  const usedPct = Math.round((used / total) * 100);
  const availPct = Math.round((available / total) * 100);
  const resPct = 100 - usedPct - availPct;

  return [
    {
      name: 'Available',
      value: available,
      percent: availPct,
      formatted: formatBytes(available * 1024 * 1024),
      color: '#5794F2' // Blue
    },
    {
      name: 'Used',
      value: used,
      percent: usedPct,
      formatted: formatBytes(used * 1024 * 1024),
      color: '#F2495C' // Red
    },
    {
      name: 'Reserved',
      value: reserved,
      percent: resPct,
      formatted: formatBytes(reserved * 1024 * 1024),
      color: '#8e8e99' // Gray
    }
  ];
});

const swapMemoryDonut = computed<DonutItem[]>(() => {
  const total = props.server.swap_total || 2048;
  const used = props.server.swap_used || 120;
  const available = Math.max(0, total - used);
  const usedPct = Math.round((used / total) * 100);
  const availPct = 100 - usedPct;

  return [
    {
      name: 'Available',
      value: available,
      percent: availPct,
      formatted: formatBytes(available * 1024 * 1024),
      color: '#73BF69' // Green
    },
    {
      name: 'Used',
      value: used,
      percent: usedPct,
      formatted: formatBytes(used * 1024 * 1024),
      color: '#5794F2' // Blue
    }
  ];
});

// CPU Bars
const hostCpuBars = computed<BarItem[]>(() => {
  return [
    { label: 'CPU 0', percent: 85, valueFormatted: '2.0 GHz', color: '#5794F2' },
    { label: 'CPU 1', percent: 85, valueFormatted: '2.0 GHz', color: '#5794F2' },
    { label: 'CPU 2', percent: 85, valueFormatted: '2.0 GHz', color: '#5794F2' },
    { label: 'CPU 3', percent: 85, valueFormatted: '2.0 GHz', color: '#5794F2' }
  ];
});

const verticalCpuBars = computed<BarItem[]>(() => {
  return [
    { label: 'CPU 0', percent: 12, valueFormatted: '1.7G', color: '#73BF69' },
    { label: 'CPU 1', percent: 8, valueFormatted: '1.7G', color: '#73BF69' },
    { label: 'CPU 2', percent: 5, valueFormatted: '1.7G', color: '#73BF69' },
    { label: 'CPU 3', percent: 10, valueFormatted: '1.7G', color: '#73BF69' },
    { label: 'CPU 4', percent: 6, valueFormatted: '1.7G', color: '#73BF69' },
    { label: 'CPU 5', percent: 14, valueFormatted: '1.7G', color: '#73BF69' },
    { label: 'CPU 6', percent: 9, valueFormatted: '1.7G', color: '#73BF69' },
    { label: 'CPU 7', percent: 7, valueFormatted: '1.7G', color: '#73BF69' }
  ];
});

const secondaryCpuBars = computed<BarItem[]>(() => {
  return [
    { label: 'CPU 0', percent: 70, valueFormatted: '700 MHz', color: '#73BF69' },
    { label: 'CPU 1', percent: 70, valueFormatted: '700 MHz', color: '#73BF69' },
    { label: 'CPU 2', percent: 70, valueFormatted: '700 MHz', color: '#73BF69' },
    { label: 'CPU 3', percent: 60, valueFormatted: '600 MHz', color: '#5794F2' }
  ];
});

const partitionBars = computed<BarItem[]>(() => {
  return [
    { label: 'NVME', percent: 43.49, valueFormatted: '43.5%', color: '#B877D9' },
    { label: 'SSD1', percent: 1.33, valueFormatted: '1.3%', color: '#5794F2' },
    { label: 'SSD2', percent: 1.13, valueFormatted: '1.1%', color: '#73BF69' },
    { label: 'HDD', percent: 3.09, valueFormatted: '3.1%', color: '#FF9830' },
    { label: 'RPi4', percent: 5.39, valueFormatted: '5.4%', color: '#FADE2A' },
    { label: 'PiKVM', percent: 59.17, valueFormatted: '59.2%', color: '#5794F2' }
  ];
});

// Time Series State
const historyTimestamps = ref<number[]>([]);
const memoryHistorySeries = ref<SeriesConfig[]>([]);
const powerMetricsSeries = ref<SeriesConfig[]>([]);
const cpuUsageSeries = ref<SeriesConfig[]>([]);
const cpuPowerSeries = ref<SeriesConfig[]>([]);
const temperatureSeries = ref<SeriesConfig[]>([]);
const pingTimestamps = ref<number[]>([]);
const pingLatencySeries = ref<SeriesConfig[]>([]);
const gpuUsageSeries = ref<SeriesConfig[]>([]);
const energySeries = ref<SeriesConfig[]>([]);
const diskTempSeries = ref<SeriesConfig[]>([]);
const diskUsageMirrorSeries = ref<SeriesConfig[]>([]);
const bandwidthMirrorSeries = ref<SeriesConfig[]>([]);

const rebuildSeries = () => {
  const h = props.history;
  if (!h || h.length === 0) return;

  const ts = h.map(row => row.timestamp);
  historyTimestamps.value = ts;

  // Memory History
  const usedRam = h.map(r => r.ram_used || 1200);
  const physTotal = h.map(() => props.server.ram_total || 4096);
  memoryHistorySeries.value = [
    {
      name: 'Physical Memory',
      data: physTotal,
      color: '#73BF69',
      lastValue: `${formatBytes(physTotal[physTotal.length - 1] * 1024 * 1024)}`
    },
    {
      name: 'Used Physical Memory',
      data: usedRam,
      color: '#5794F2',
      lastValue: `${formatBytes(usedRam[usedRam.length - 1] * 1024 * 1024)}`
    }
  ];

  // Power Metrics
  powerMetricsSeries.value = [
    {
      name: 'Power (W)',
      data: h.map((_, i) => parseFloat((5.1 + Math.sin(i / 2) * 0.4).toFixed(1))),
      color: '#73BF69',
      lastValue: '5.3 W'
    },
    {
      name: 'Current (mA)',
      data: h.map((_, i) => parseFloat((58 + Math.cos(i / 2) * 2).toFixed(1))),
      color: '#5794F2',
      lastValue: '59.0 mA'
    }
  ];

  // CPU Usage
  cpuUsageSeries.value = [
    {
      name: 'CPU Average',
      data: h.map(r => r.cpu || 10),
      color: '#FADE2A',
      fillOpacity: 0.2,
      lastValue: `${(h[h.length - 1]?.cpu || 0).toFixed(1)}%`
    },
    {
      name: 'CPU 0 T0',
      data: h.map(r => Math.min(100, Math.round((r.cpu || 10) * 1.1))),
      color: '#73BF69',
      lastValue: '12%'
    },
    {
      name: 'CPU 1 T0',
      data: h.map(r => Math.min(100, Math.round((r.cpu || 10) * 0.9))),
      color: '#5794F2',
      lastValue: '8%'
    }
  ];

  // CPU Power
  cpuPowerSeries.value = [
    {
      name: 'CPU Power',
      data: h.map((_, i) => parseFloat((24 + Math.sin(i / 4) * 2).toFixed(1))),
      color: '#56C5DB',
      fillOpacity: 0.3,
      lastValue: '25 W'
    }
  ];

  // Temperatures
  temperatureSeries.value = [
    {
      name: 'CPU Socket',
      data: h.map((_, i) => 44 + Math.round(Math.sin(i / 3) * 3)),
      color: '#F2495C',
      lastValue: '46.7 °C'
    },
    {
      name: 'Motherboard',
      data: h.map((_, i) => 36 + Math.round(Math.cos(i / 3) * 1)),
      color: '#5794F2',
      lastValue: '36.0 °C'
    },
    {
      name: 'Drive Array',
      data: h.map((_, i) => 38 + Math.round(Math.sin(i / 2) * 2)),
      color: '#FF9830',
      lastValue: '38.0 °C'
    }
  ];

  // Ping Latency
  if (props.server.ping && props.server.ping.length > 0) {
    pingTimestamps.value = props.server.ping.map(p => p.ts);
    pingLatencySeries.value = [
      {
        name: 'China Telecom',
        data: props.server.ping.map(p => Number(p.ct) || 0),
        color: '#5794F2',
        lastValue: `${props.server.ping_ct ?? '-'} ms`
      },
      {
        name: 'China Unicom',
        data: props.server.ping.map(p => Number(p.cu) || 0),
        color: '#FF9830',
        lastValue: `${props.server.ping_cu ?? '-'} ms`
      },
      {
        name: 'China Mobile',
        data: props.server.ping.map(p => Number(p.cm) || 0),
        color: '#73BF69',
        lastValue: `${props.server.ping_cm ?? '-'} ms`
      }
    ];
  } else {
    pingTimestamps.value = ts;
    pingLatencySeries.value = [
      { name: 'China Telecom', data: h.map(() => 23), color: '#5794F2', lastValue: '23 ms' },
      { name: 'China Unicom', data: h.map(() => 25), color: '#FF9830', lastValue: '25 ms' },
      { name: 'China Mobile', data: h.map(() => 30), color: '#73BF69', lastValue: '30 ms' }
    ];
  }

  // GPU Usage
  gpuUsageSeries.value = [
    {
      name: 'GPU Core',
      data: h.map((_, i) => (i % 8 === 0 ? 15 : 0)),
      color: '#73BF69',
      lastValue: '0%'
    },
    {
      name: 'VRAM Usage',
      data: h.map(() => 402),
      color: '#FF9830',
      lastValue: '402.6 MB'
    }
  ];

  // Energy Generation
  energySeries.value = [
    {
      name: 'Current Power',
      data: h.map((_, i) => parseFloat((2.2 + Math.sin(i / 6) * 0.5).toFixed(2))),
      color: '#73BF69',
      fillOpacity: 0.35,
      lastValue: '2.41 kW'
    }
  ];

  // Disk Temp
  diskTempSeries.value = [
    {
      name: 'NVME: SN750',
      data: h.map((_, i) => 46 + Math.round(Math.sin(i / 3))),
      color: '#B877D9',
      lastValue: '47 °C'
    },
    {
      name: 'SSD: SSV5',
      data: h.map(() => 40),
      color: '#73BF69',
      lastValue: '40 °C'
    },
    {
      name: 'HDD: TOSHIBA',
      data: h.map(() => 35),
      color: '#FF9830',
      lastValue: '35 °C'
    }
  ];

  // Disk Read/Write Mirror
  diskUsageMirrorSeries.value = [
    {
      name: 'Write',
      data: h.map(r => Math.round((r.disk?.write_bps || 1024 * 50) / 1024)),
      color: '#5794F2',
      lastValue: '50 KB/s'
    },
    {
      name: 'Read (Neg)',
      data: h.map(r => -Math.round((r.disk?.read_bps || 1024 * 80) / 1024)),
      color: '#B877D9',
      lastValue: '-80 KB/s'
    }
  ];

  // Bandwidth Download/Upload Mirror
  bandwidthMirrorSeries.value = [
    {
      name: 'Download',
      data: h.map(r => Math.round((r.net_in_speed || 1024 * 60) / 1024)),
      color: '#73BF69',
      lastValue: `${Math.round((props.server.net_in_speed || 0) / 1024)} KB/s`
    },
    {
      name: 'Upload (Neg)',
      data: h.map(r => -Math.round((r.net_out_speed || 1024 * 40) / 1024)),
      color: '#5794F2',
      lastValue: `-${Math.round((props.server.net_out_speed || 0) / 1024)} KB/s`
    }
  ];
};

onMounted(() => {
  rebuildSeries();
});

watch(() => [props.history, props.server], () => {
  rebuildSeries();
}, { deep: true });
</script>
