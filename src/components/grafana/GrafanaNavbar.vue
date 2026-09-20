<template>
  <header class="bg-[#14161a] border-b border-[#26292e] h-12 px-3 flex items-center justify-between select-none z-30 sticky top-0 shadow-sm">
    <!-- Left: Logo & Breadcrumbs -->
    <div class="flex items-center space-x-3">
      <!-- Logo Icon (Grafana styled orange box) -->
      <router-link to="/" class="flex items-center space-x-2 text-white hover:opacity-90 transition-opacity">
        <div class="w-6 h-6 rounded bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-inner">
          <Activity class="w-3.5 h-3.5 text-white" />
        </div>
      </router-link>

      <div class="h-4 w-px bg-[#2a2d34]"></div>

      <!-- Breadcrumb Path -->
      <nav class="flex items-center space-x-1.5 text-xs">
        <router-link to="/" class="text-grafana-muted hover:text-white transition-colors">Home</router-link>
        <span class="text-grafana-darkmuted">/</span>
        <router-link to="/" class="text-grafana-muted hover:text-white transition-colors">Dashboards</router-link>
        <span class="text-grafana-darkmuted">/</span>
        <div class="flex items-center space-x-1 font-semibold text-grafana-text">
          <span class="truncate max-w-[160px] md:max-w-xs">{{ currentTitle }}</span>
          <Star class="w-3 h-3 text-amber-400 fill-amber-400" />
        </div>
      </nav>

      <!-- Server Switcher Dropdown (in Detail page) -->
      <div v-if="servers.length > 0 && currentServerId" class="hidden sm:block">
        <select
          :value="currentServerId"
          @change="$emit('select-server', ($event.target as HTMLSelectElement).value)"
          class="bg-[#1e2026] text-xs text-grafana-text border border-[#2e323b] rounded px-2 py-1 focus:outline-none focus:border-grafana-blue cursor-pointer"
        >
          <option v-for="s in servers" :key="s.id" :value="s.id">
            {{ s.name }} ({{ s.region || 'UN' }})
          </option>
        </select>
      </div>
    </div>

    <!-- Right Controls: Time Picker, Refresh, Admin, Fullscreen -->
    <div class="flex items-center space-x-2">
      <!-- Mock Mode Badge -->
      <div
        v-if="isMock"
        class="hidden md:flex items-center space-x-1 text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/80 px-2 py-0.5 rounded"
        title="当前处于离线演示模式，生成高保真动态数据"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span>DEMO PREVIEW</span>
      </div>

      <!-- Time Range Selector -->
      <div class="relative">
        <select
          v-model="selectedTimeRange"
          @change="$emit('time-range-change', Number(selectedTimeRange))"
          class="bg-[#1b1d22] hover:bg-[#22252c] text-[11px] text-grafana-text border border-[#2a2e36] rounded px-2 py-1 focus:outline-none focus:border-grafana-blue cursor-pointer transition-colors"
        >
          <option :value="0.167">Last 10 minutes</option>
          <option :value="0.5">Last 30 minutes</option>
          <option :value="1">Last 1 hour</option>
          <option :value="6">Last 6 hours</option>
          <option :value="12">Last 12 hours</option>
          <option :value="24">Last 24 hours</option>
          <option :value="168">Last 7 days</option>
        </select>
      </div>

      <!-- Refresh Interval -->
      <div class="flex items-center bg-[#1b1d22] border border-[#2a2e36] rounded overflow-hidden">
        <button
          @click="$emit('refresh-now')"
          class="p-1.5 text-grafana-muted hover:text-white hover:bg-[#252830] transition-colors"
          title="立即刷新"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
        </button>
        <select
          v-model="refreshInterval"
          @change="$emit('interval-change', Number(refreshInterval))"
          class="bg-transparent text-[11px] text-grafana-muted hover:text-grafana-text border-l border-[#2a2e36] px-1.5 py-1 focus:outline-none cursor-pointer"
        >
          <option :value="0">Off</option>
          <option :value="3">3s</option>
          <option :value="5">5s</option>
          <option :value="10">10s</option>
          <option :value="30">30s</option>
        </select>
      </div>

      <!-- Fullscreen Toggle -->
      <button
        @click="toggleFullscreen"
        class="hidden sm:flex p-1.5 text-grafana-muted hover:text-white bg-[#1b1d22] hover:bg-[#252830] border border-[#2a2e36] rounded transition-colors"
        title="全屏显示"
      >
        <Maximize class="w-3.5 h-3.5" />
      </button>

      <!-- Admin Portal Link (Strictly /admin#admin as requested in theme-develop.md) -->
      <a
        href="/admin#admin"
        class="flex items-center space-x-1 text-xs bg-[#242730] hover:bg-[#2d323e] text-grafana-text hover:text-white border border-[#343946] px-2.5 py-1 rounded transition-colors"
        title="进入默认管理后台"
      >
        <Shield class="w-3.5 h-3.5 text-grafana-blue" />
        <span class="hidden sm:inline">Admin</span>
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Activity,
  Star,
  RefreshCw,
  Maximize,
  Shield
} from 'lucide-vue-next';
import type { Server } from '../../types';

withDefaults(
  defineProps<{
    currentTitle: string;
    servers?: Server[];
    currentServerId?: string;
    isRefreshing?: boolean;
    isMock?: boolean;
  }>(),
  {
    servers: () => [],
    currentServerId: '',
    isRefreshing: false,
    isMock: false
  }
);

defineEmits<{
  (e: 'select-server', id: string): void;
  (e: 'time-range-change', hours: number): void;
  (e: 'interval-change', seconds: number): void;
  (e: 'refresh-now'): void;
}>();

const selectedTimeRange = ref<number>(24);
const refreshInterval = ref<number>(3);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};
</script>
