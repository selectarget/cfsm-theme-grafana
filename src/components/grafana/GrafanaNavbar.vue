<template>
  <header class="bg-[#14161a] border-b border-[#26292e] min-h-12 px-2.5 sm:px-3 flex items-center justify-between select-none z-30 sticky top-0 shadow-sm">
    <!-- Left: Logo & Breadcrumbs -->
    <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
      <!-- Logo Icon (Grafana styled orange box) -->
      <router-link to="/" class="flex items-center space-x-2 text-white hover:opacity-90 transition-opacity flex-shrink-0">
        <div class="w-6 h-6 rounded bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-inner">
          <Activity class="w-3.5 h-3.5 text-white" />
        </div>
      </router-link>

      <div class="h-4 w-px bg-[#2a2d34] hidden sm:block"></div>

      <!-- Breadcrumb Path -->
      <nav class="flex items-center space-x-1 sm:space-x-1.5 text-xs truncate">
        <router-link to="/" class="text-grafana-muted hover:text-white transition-colors hidden md:inline">{{ t('home') }}</router-link>
        <span class="text-grafana-darkmuted hidden md:inline">/</span>
        <router-link to="/" class="text-grafana-muted hover:text-white transition-colors hidden sm:inline">{{ t('dashboards') }}</router-link>
        <span class="text-grafana-darkmuted hidden sm:inline">/</span>
        <div class="flex items-center space-x-1 font-semibold text-grafana-text truncate">
          <span class="truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">{{ currentTitle }}</span>
          <Star class="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
        </div>
      </nav>

      <!-- Server Switcher Dropdown (in Detail page) -->
      <div v-if="servers.length > 0 && currentServerId" class="hidden lg:block">
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

    <!-- Right Controls: Theme Palette, Language, Time Picker, Refresh, Admin, Fullscreen -->
    <div class="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
      <!-- Theme Palette Dropdown -->
      <div class="relative">
        <button
          @click="showPaletteMenu = !showPaletteMenu"
          class="p-1.5 text-grafana-muted hover:text-white bg-[#1b1d22] hover:bg-[#252830] border border-[#2a2e36] rounded transition-colors"
          title="切换配色主题 (Theme Presets)"
        >
          <Palette class="w-3.5 h-3.5 text-grafana-blue" />
        </button>

        <!-- Palette Dropdown Menu -->
        <div
          v-if="showPaletteMenu"
          class="absolute right-0 mt-1.5 w-52 bg-[#181b22] border border-[#2a2e3a] rounded shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div class="px-3 py-1 text-[10px] uppercase font-bold text-grafana-muted tracking-wider border-b border-[#222530] mb-1">
            配色方案 / Theme Presets
          </div>
          <button
            v-for="p in themePresets"
            :key="p.id"
            @click="selectTheme(p.id)"
            class="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#222632] transition-colors"
            :class="activeTheme === p.id ? 'text-white font-semibold' : 'text-grafana-muted'"
          >
            <div class="flex items-center space-x-2">
              <span
                class="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
                :style="{ backgroundColor: p.dotColor }"
              ></span>
              <span class="text-[11px]">{{ currentLang === 'zh' ? p.nameZh : p.nameEn }}</span>
            </div>
            <Check v-if="activeTheme === p.id" class="w-3.5 h-3.5 text-grafana-blue" />
          </button>
        </div>
      </div>

      <!-- Language Switcher (ZH / EN) -->
      <button
        @click="toggleLanguage"
        class="flex items-center space-x-1 text-[11px] font-semibold bg-[#1b1d22] hover:bg-[#252830] text-grafana-text hover:text-white border border-[#2a2e36] px-2 py-1 rounded transition-colors"
        :title="currentLang === 'zh' ? 'Switch to English' : '切换至中文'"
      >
        <Languages class="w-3.5 h-3.5 text-grafana-blue" />
        <span class="uppercase">{{ currentLang === 'zh' ? 'EN' : '中' }}</span>
      </button>

      <!-- Time Range Selector -->
      <div class="relative">
        <select
          v-model="selectedTimeRange"
          @change="$emit('time-range-change', Number(selectedTimeRange))"
          class="bg-[#1b1d22] hover:bg-[#22252c] text-[10px] sm:text-[11px] text-grafana-text border border-[#2a2e36] rounded px-1.5 sm:px-2 py-1 focus:outline-none focus:border-grafana-blue cursor-pointer transition-colors max-w-[90px] sm:max-w-none"
        >
          <option :value="0.167">{{ t('last10m') }}</option>
          <option :value="0.5">{{ t('last30m') }}</option>
          <option :value="1">{{ t('last1h') }}</option>
          <option :value="6">{{ t('last6h') }}</option>
          <option :value="12">{{ t('last12h') }}</option>
          <option :value="24">{{ t('last24h') }}</option>
          <option :value="168">{{ t('last7d') }}</option>
        </select>
      </div>

      <!-- Refresh Interval -->
      <div class="flex items-center bg-[#1b1d22] border border-[#2a2e36] rounded overflow-hidden">
        <button
          @click="$emit('refresh-now')"
          class="p-1 sm:p-1.5 text-grafana-muted hover:text-white hover:bg-[#252830] transition-colors"
          :title="t('refreshNow')"
        >
          <RefreshCw class="w-3 h-3 sm:w-3.5 sm:h-3.5" :class="{ 'animate-spin': isRefreshing }" />
        </button>
        <select
          v-model="refreshInterval"
          @change="$emit('interval-change', Number(refreshInterval))"
          class="bg-transparent text-[10px] sm:text-[11px] text-grafana-muted hover:text-grafana-text border-l border-[#2a2e36] px-1 sm:px-1.5 py-1 focus:outline-none cursor-pointer"
        >
          <option :value="0">{{ t('off') }}</option>
          <option :value="3">3s</option>
          <option :value="5">5s</option>
          <option :value="10">10s</option>
          <option :value="30">30s</option>
        </select>
      </div>

      <!-- Fullscreen Toggle -->
      <button
        @click="toggleFullscreen"
        class="hidden md:flex p-1.5 text-grafana-muted hover:text-white bg-[#1b1d22] hover:bg-[#252830] border border-[#2a2e36] rounded transition-colors"
        :title="t('fullscreen')"
      >
        <Maximize class="w-3.5 h-3.5" />
      </button>

      <!-- Admin Portal Link (Strictly /admin#admin) -->
      <a
        href="/admin#admin"
        class="flex items-center space-x-1 text-[11px] sm:text-xs bg-[#242730] hover:bg-[#2d323e] text-grafana-text hover:text-white border border-[#343946] px-2 sm:px-2.5 py-1 rounded transition-colors"
        :title="t('admin')"
      >
        <Shield class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-grafana-blue" />
        <span class="hidden sm:inline">{{ t('admin') }}</span>
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
  Shield,
  Languages,
  Palette,
  Check
} from 'lucide-vue-next';
import type { Server } from '../../types';
import { t, currentLang, toggleLanguage } from '../../utils/i18n';
import { themePresets, activeTheme, applyTheme, type ThemePresetId } from '../../utils/themePresets';

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
const showPaletteMenu = ref(false);

const selectTheme = (id: ThemePresetId) => {
  applyTheme(id, true);
  showPaletteMenu.value = false;
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};
</script>
