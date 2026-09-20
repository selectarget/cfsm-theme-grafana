<template>
  <div class="space-y-4">
    <!-- Cluster Macro Stat Panels (Row 1) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      <!-- Total Servers -->
      <GrafanaPanel title="Total Nodes">
        <StatCard
          :value="stats.total"
          size="md"
          color="white"
          label="Total Systems"
        />
      </GrafanaPanel>

      <!-- Online Status -->
      <GrafanaPanel title="Online Status">
        <StatCard
          :value="stats.online"
          unit="UP"
          size="md"
          color="green"
          label="Active & Healthy"
          glow
        />
      </GrafanaPanel>

      <!-- Offline -->
      <GrafanaPanel title="Offline Nodes">
        <StatCard
          :value="stats.offline"
          unit="DOWN"
          size="md"
          :color="stats.offline > 0 ? 'red' : 'green'"
          label="Unreachable"
          :glow="stats.offline > 0"
        />
      </GrafanaPanel>

      <!-- Global Net In -->
      <GrafanaPanel title="Global Download">
        <StatCard
          :value="formatSpeedVal(stats.globalSpeedIn).val"
          :unit="formatSpeedVal(stats.globalSpeedIn).unit"
          size="md"
          color="cyan"
          label="Aggregated RX"
        />
      </GrafanaPanel>

      <!-- Global Net Out -->
      <GrafanaPanel title="Global Upload">
        <StatCard
          :value="formatSpeedVal(stats.globalSpeedOut).val"
          :unit="formatSpeedVal(stats.globalSpeedOut).unit"
          size="md"
          color="blue"
          label="Aggregated TX"
        />
      </GrafanaPanel>

      <!-- Total Monthly Net -->
      <GrafanaPanel title="Total Traffic">
        <StatCard
          :value="formatBytesVal(stats.globalNetRx + stats.globalNetTx).val"
          :unit="formatBytesVal(stats.globalNetRx + stats.globalNetTx).unit"
          size="md"
          color="purple"
          label="Combined Flow"
        />
      </GrafanaPanel>
    </div>

    <!-- Cluster Performance Trend Charts (Row 2) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
      <!-- Traffic Bandwidth Mirror Chart -->
      <div class="lg:col-span-2">
        <GrafanaPanel title="Cluster Network Throughput (RX / TX)" timeBadge="Live">
          <TimeSeriesChart
            :series-list="clusterThroughputSeries"
            :timestamps="throughputTimestamps"
            :show-legend-table="true"
            :y-axis-formatter="formatSpeed"
            unit="B/s"
          />
        </GrafanaPanel>
      </div>

      <!-- Latency & Ping Status -->
      <div>
        <GrafanaPanel title="Multi-line Latency Overview" timeBadge="Realtime">
          <TimeSeriesChart
            :series-list="latencySeries"
            :timestamps="latencyTimestamps"
            :show-legend-table="true"
            unit="ms"
          />
        </GrafanaPanel>
      </div>
    </div>

    <!-- Filter & Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-2 py-1 px-0.5">
      <div class="flex items-center space-x-2">
        <span class="text-xs font-semibold text-grafana-muted uppercase tracking-wider">Node Matrix</span>
        <span class="text-xs text-[#52545c]">({{ filteredServers.length }} instances)</span>
      </div>

      <div class="flex items-center space-x-2 text-xs">
        <!-- Group filter -->
        <select
          v-model="selectedGroup"
          class="bg-[#181b1f] border border-[#26292e] text-grafana-text text-xs rounded px-2.5 py-1 focus:outline-none focus:border-grafana-blue cursor-pointer"
        >
          <option value="">All Groups</option>
          <option v-for="g in availableGroups" :key="g" :value="g">{{ g }}</option>
        </select>

        <!-- Search Input -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter by name, IP, tag..."
          class="bg-[#181b1f] border border-[#26292e] text-grafana-text text-xs rounded px-2.5 py-1 focus:outline-none focus:border-grafana-blue placeholder-[#555963] w-48"
        />
      </div>
    </div>

    <!-- Node Matrix Grid (Cards) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <ServerCard
        v-for="server in filteredServers"
        :key="server.id"
        :server="server"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import GrafanaPanel from '../components/grafana/GrafanaPanel.vue';
import StatCard from '../components/grafana/StatCard.vue';
import TimeSeriesChart, { type SeriesConfig } from '../components/grafana/TimeSeriesChart.vue';
import ServerCard from '../components/ServerCard.vue';
import type { Server, Stats } from '../types';
import { formatSpeed } from '../utils/format';

const props = defineProps<{
  servers: Server[];
  stats: Stats;
}>();

const searchQuery = ref('');
const selectedGroup = ref('');

const availableGroups = computed(() => {
  const groups = new Set<string>();
  props.servers.forEach(s => {
    if (s.server_group) groups.add(s.server_group);
  });
  return Array.from(groups);
});

const filteredServers = computed(() => {
  return props.servers.filter(s => {
    if (selectedGroup.value && s.server_group !== selectedGroup.value) {
      return false;
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchTag = (s.tags || '').toLowerCase().includes(q);
      const matchOs = (s.os || '').toLowerCase().includes(q);
      return matchName || matchTag || matchOs;
    }
    return true;
  });
});

// Format helpers
const formatSpeedVal = (bps: number) => {
  if (!bps || bps <= 0) return { val: '0', unit: 'KB/s' };
  if (bps > 1024 * 1024 * 1024) return { val: (bps / (1024 * 1024 * 1024)).toFixed(1), unit: 'GB/s' };
  if (bps > 1024 * 1024) return { val: (bps / (1024 * 1024)).toFixed(1), unit: 'MB/s' };
  return { val: (bps / 1024).toFixed(0), unit: 'KB/s' };
};

const formatBytesVal = (bytes: number) => {
  if (!bytes || bytes <= 0) return { val: '0', unit: 'GB' };
  if (bytes > 1024 * 1024 * 1024 * 1024) return { val: (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1), unit: 'TB' };
  return { val: (bytes / (1024 * 1024 * 1024)).toFixed(1), unit: 'GB' };
};

// Cluster charts mock history
const throughputTimestamps = ref<string[]>([]);
const clusterThroughputSeries = ref<SeriesConfig[]>([]);

const latencyTimestamps = ref<string[]>([]);
const latencySeries = ref<SeriesConfig[]>([]);

const buildChartData = () => {
  const points = 24;
  const now = Date.now();
  const times: string[] = [];
  const rxData: number[] = [];
  const txData: number[] = [];
  const ctData: number[] = [];
  const cuData: number[] = [];
  const cmData: number[] = [];

  for (let i = points; i >= 0; i--) {
    const t = new Date(now - i * 5 * 60000);
    times.push(`${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`);
    
    // speed
    rxData.push(Math.round(1024 * (8000 + Math.sin(i / 3) * 3500 + Math.random() * 1000)));
    txData.push(Math.round(1024 * (12000 + Math.cos(i / 3) * 5000 + Math.random() * 1500)));

    // latency
    ctData.push(Math.round(22 + Math.random() * 6));
    cuData.push(Math.round(25 + Math.random() * 5));
    cmData.push(Math.round(31 + Math.random() * 8));
  }

  throughputTimestamps.value = times;
  clusterThroughputSeries.value = [
    {
      name: 'Download (RX)',
      data: rxData,
      color: '#73BF69',
      fillOpacity: 0.25,
      lastValue: `${(rxData[rxData.length - 1] / 1024 / 1024).toFixed(1)} MB/s`
    },
    {
      name: 'Upload (TX)',
      data: txData,
      color: '#5794F2',
      fillOpacity: 0.25,
      lastValue: `${(txData[txData.length - 1] / 1024 / 1024).toFixed(1)} MB/s`
    }
  ];

  latencyTimestamps.value = times;
  latencySeries.value = [
    {
      name: 'China Telecom',
      data: ctData,
      color: '#5794F2',
      lastValue: `${ctData[ctData.length - 1]} ms`
    },
    {
      name: 'China Unicom',
      data: cuData,
      color: '#FF9830',
      lastValue: `${cuData[cuData.length - 1]} ms`
    },
    {
      name: 'China Mobile',
      data: cmData,
      color: '#73BF69',
      lastValue: `${cmData[cmData.length - 1]} ms`
    }
  ];
};

onMounted(() => {
  buildChartData();
});
</script>
