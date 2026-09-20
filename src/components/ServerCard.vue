<template>
  <div
    @click="$router.push(`/server/${server.id}`)"
    class="grafana-card p-3 cursor-pointer hover:border-grafana-blue/60 transition-all duration-200 flex flex-col justify-between group"
  >
    <!-- Top Header -->
    <div class="flex items-center justify-between border-b border-[#22252a] pb-2 mb-2">
      <div class="flex items-center space-x-2 min-w-0">
        <!-- Status Dot -->
        <span
          class="w-2 h-2 rounded-full flex-shrink-0"
          :class="isOnline ? 'bg-grafana-green animate-pulse shadow-[0_0_8px_#73BF69]' : 'bg-grafana-red shadow-[0_0_8px_#F2495C]'"
        ></span>

        <!-- Flag -->
        <img
          :src="getFlagUrl(server.region)"
          :alt="server.region"
          class="w-4 h-3 object-cover rounded-xs border border-white/10"
          @error="($event.target as HTMLElement).style.display='none'"
        />

        <!-- Name -->
        <span class="font-semibold text-xs text-grafana-text group-hover:text-white truncate">
          {{ server.name }}
        </span>
      </div>

      <!-- Group Tag / OS -->
      <div class="flex items-center space-x-1.5 flex-shrink-0">
        <span v-if="server.server_group" class="text-[10px] bg-[#22252d] text-grafana-muted px-1.5 py-0.5 rounded border border-[#2b2f3a]">
          {{ server.server_group }}
        </span>
        <img
          :src="getOsIconUrl(server.os)"
          class="w-3.5 h-3.5 opacity-70 group-hover:opacity-100"
          :alt="server.os"
          @error="($event.target as HTMLElement).style.display='none'"
        />
      </div>
    </div>

    <!-- Metric Rows -->
    <div class="space-y-2 text-xs">
      <!-- CPU Bar -->
      <div class="space-y-0.5">
        <div class="flex justify-between text-[10px] text-grafana-muted font-medium">
          <span>CPU ({{ server.cpu_cores || 1 }} Core)</span>
          <span class="tabular-nums font-semibold" :class="getCpuColor(server.cpu)">{{ (server.cpu || 0).toFixed(1) }}%</span>
        </div>
        <div class="h-1.5 bg-[#121316] rounded-sm overflow-hidden border border-[#22252a]">
          <div
            class="h-full transition-all duration-300"
            :style="{ width: `${Math.min(100, server.cpu || 0)}%`, backgroundColor: getCpuHex(server.cpu) }"
          ></div>
        </div>
      </div>

      <!-- RAM Bar -->
      <div class="space-y-0.5">
        <div class="flex justify-between text-[10px] text-grafana-muted font-medium">
          <span>Memory ({{ formatBytes((server.ram_used || 0) * 1024 * 1024) }} / {{ formatBytes((server.ram_total || 1) * 1024 * 1024) }})</span>
          <span class="tabular-nums font-semibold text-grafana-blue">{{ ramPercent }}%</span>
        </div>
        <div class="h-1.5 bg-[#121316] rounded-sm overflow-hidden border border-[#22252a]">
          <div
            class="h-full bg-grafana-blue transition-all duration-300"
            :style="{ width: `${Math.min(100, ramPercent)}%` }"
          ></div>
        </div>
      </div>

      <!-- Disk Bar -->
      <div class="space-y-0.5">
        <div class="flex justify-between text-[10px] text-grafana-muted font-medium">
          <span>Disk ({{ formatBytes((server.disk_used || 0) * 1024 * 1024) }})</span>
          <span class="tabular-nums font-semibold text-grafana-purple">{{ diskPercent }}%</span>
        </div>
        <div class="h-1.5 bg-[#121316] rounded-sm overflow-hidden border border-[#22252a]">
          <div
            class="h-full bg-grafana-purple transition-all duration-300"
            :style="{ width: `${Math.min(100, diskPercent)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Network & Uptime Footer -->
    <div class="mt-3 pt-2 border-t border-[#22252a] grid grid-cols-2 gap-2 text-[10px]">
      <div class="flex items-center space-x-1 text-grafana-muted truncate">
        <ArrowDown class="w-3 h-3 text-grafana-green flex-shrink-0" />
        <span class="tabular-nums text-grafana-text font-medium">{{ formatSpeed(server.net_in_speed) }}</span>
      </div>
      <div class="flex items-center space-x-1 text-grafana-muted truncate justify-end">
        <ArrowUp class="w-3 h-3 text-grafana-blue flex-shrink-0" />
        <span class="tabular-nums text-grafana-text font-medium">{{ formatSpeed(server.net_out_speed) }}</span>
      </div>

      <div class="col-span-2 flex items-center justify-between text-grafana-muted pt-1 text-[9px]">
        <div class="flex items-center space-x-1">
          <Clock class="w-2.5 h-2.5" />
          <span class="tabular-nums">{{ formatUptime(server.boot_time) }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <span v-if="server.ip_v4 === '1'" class="text-[#5794F2] bg-[#1a2130] px-1 rounded">v4</span>
          <span v-if="server.ip_v6 === '1'" class="text-[#73BF69] bg-[#1a2a20] px-1 rounded">v6</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, ArrowUp, Clock } from 'lucide-vue-next';
import type { Server } from '../types';
import { formatBytes, formatSpeed, formatUptime, getFlagUrl, getOsIconUrl, isServerOnline } from '../utils/format';

const props = defineProps<{
  server: Server;
}>();

const isOnline = computed(() => isServerOnline(props.server));

const ramPercent = computed(() => {
  if (!props.server.ram_total) return 0;
  return Math.min(100, Math.round((props.server.ram_used / props.server.ram_total) * 100));
});

const diskPercent = computed(() => {
  if (!props.server.disk_total) return 0;
  return Math.min(100, Math.round((props.server.disk_used / props.server.disk_total) * 100));
});

const getCpuColor = (cpu?: number) => {
  const val = cpu || 0;
  if (val >= 90) return 'text-grafana-red';
  if (val >= 75) return 'text-grafana-orange';
  if (val >= 50) return 'text-grafana-yellow';
  return 'text-grafana-green';
};

const getCpuHex = (cpu?: number) => {
  const val = cpu || 0;
  if (val >= 90) return '#F2495C';
  if (val >= 75) return '#FF9830';
  if (val >= 50) return '#FADE2A';
  return '#73BF69';
};
</script>
