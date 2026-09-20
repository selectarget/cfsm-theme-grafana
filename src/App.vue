<template>
  <div class="min-h-screen flex flex-col bg-[#111217] text-grafana-text font-sans">
    <!-- Top Grafana Navbar -->
    <GrafanaNavbar
      :current-title="pageTitle"
      :servers="servers"
      :current-server-id="currentServerId"
      :is-refreshing="isRefreshing"
      :is-mock="isMock"
      @select-server="handleSelectServer"
      @time-range-change="handleTimeRangeChange"
      @interval-change="handleIntervalChange"
      @refresh-now="fetchData(false)"
    />

    <!-- WS Inactivity Timeout Notice Modal/Banner -->
    <div
      v-if="showTimeoutAlert"
      class="bg-amber-900/90 border-b border-amber-600 px-4 py-2 text-xs flex items-center justify-between text-white z-40 sticky top-12"
    >
      <div class="flex items-center space-x-2">
        <AlertTriangle class="w-4 h-4 text-amber-300 flex-shrink-0" />
        <span>{{ t('timeoutNotice') }}</span>
      </div>
      <button
        @click="resumeWebSocket"
        class="bg-amber-700 hover:bg-amber-600 px-3 py-1 rounded text-white font-medium transition-colors"
      >
        {{ t('reconnect') }}
      </button>
    </div>

    <!-- Main Content View -->
    <main class="flex-1 max-w-[1920px] w-full mx-auto p-2 sm:p-3 min-h-[calc(100vh-80px)]">
      <router-view
        v-if="!initialLoading"
        :servers="servers"
        :stats="stats"
        :server="currentServer"
        :history="currentHistory"
      />

      <div v-else class="h-96 flex flex-col items-center justify-center space-y-3 text-grafana-muted">
        <div class="w-8 h-8 border-2 border-grafana-blue border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs">{{ t('loading') }}</span>
      </div>
    </main>

    <!-- Footer - Required by theme-develop.md -->
    <footer class="border-t border-[#22252a] py-3 px-4 text-center text-xs text-grafana-muted flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center space-x-2">
        <span class="w-2 h-2 rounded-full" :class="isWsConnected ? 'bg-grafana-green' : 'bg-grafana-muted'"></span>
        <span class="text-[11px]">{{ isWsConnected ? 'WebSocket Live Stream' : 'REST Polling' }}</span>
        <span v-if="siteConfig?.version" class="text-[11px] text-[#52545c]">| Workers {{ siteConfig.version }}</span>
      </div>

      <!-- Mandatory powered-by link -->
      <div class="flex items-center space-x-1">
        <span>Powered by</span>
        <a
          href="https://github.com/huilang-me/CF-Server-Monitor/"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-grafana-text hover:text-white hover:underline transition-colors"
        >
          CF-Server-Monitor
        </a>
        <span v-if="siteConfig?.version" class="text-grafana-muted ml-0.5">v{{ siteConfig.version }}</span>
      </div>

      <div class="text-[11px] text-grafana-muted">
        Grafana Industrial Theme
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AlertTriangle } from 'lucide-vue-next';
import GrafanaNavbar from './components/grafana/GrafanaNavbar.vue';
import { apiClient } from './api/client';
import { wsClient } from './api/ws';
import type { SiteConfig, Server, Stats, HistoryMetricRow } from './types';
import { initLanguage, t } from './utils/i18n';

const route = useRoute();
const router = useRouter();

const initialLoading = ref(true);
const isRefreshing = ref(false);
const isWsConnected = ref(false);
const showTimeoutAlert = ref(false);
const isMock = ref(false);

const siteConfig = ref<SiteConfig | null>(null);
const servers = ref<Server[]>([]);
const stats = ref<Stats>({
  total: 0,
  online: 0,
  offline: 0,
  globalSpeedIn: 0,
  globalSpeedOut: 0,
  globalNetTx: 0,
  globalNetRx: 0
});

const currentHistory = ref<HistoryMetricRow[]>([]);
const activeHours = ref<number>(24);
let pollTimer: any = null;

const currentServerId = computed(() => {
  return (route.params.id as string) || '';
});

const currentServer = computed(() => {
  if (!currentServerId.value) return servers.value[0];
  return servers.value.find(s => s.id === currentServerId.value) || servers.value[0];
});

const pageTitle = computed(() => {
  if (route.name === 'ServerDetail' && currentServer.value) {
    return `${currentServer.value.name} (Telemetry)`;
  }
  return siteConfig.value?.site_title || 'CF-Server-Monitor';
});

const fetchData = async (isSilent = true) => {
  if (!isSilent) isRefreshing.value = true;
  try {
    const sData = await apiClient.getServers();
    servers.value = sData.servers;
    stats.value = sData.stats;
    isMock.value = apiClient.isMockMode;

    if (currentServerId.value) {
      await fetchHistory(currentServerId.value, activeHours.value);
    }
  } catch (err) {
    console.error('Failed to load servers:', err);
  } finally {
    isRefreshing.value = false;
    initialLoading.value = false;
  }
};

const fetchHistory = async (id: string, hours: number) => {
  try {
    const h = await apiClient.getHistory(id, hours);
    currentHistory.value = h;
  } catch (err) {
    console.error('Failed to fetch history:', err);
  }
};

const handleSelectServer = (id: string) => {
  router.push(`/server/${id}`);
};

const handleTimeRangeChange = (hours: number) => {
  activeHours.value = hours;
  if (currentServerId.value) {
    fetchHistory(currentServerId.value, hours);
  }
};

const handleIntervalChange = (seconds: number) => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (seconds > 0) {
    pollTimer = setInterval(() => {
      fetchData(true);
    }, seconds * 1000);
  }
};

const resumeWebSocket = () => {
  showTimeoutAlert.value = false;
  wsClient.resumeFromTimeout();
  isWsConnected.value = true;
};

// Route and subscription sync
const syncSubscriptions = () => {
  if (route.name === 'ServerDetail' && currentServerId.value) {
    wsClient.subscribeSingle(currentServerId.value);
    fetchHistory(currentServerId.value, activeHours.value);
  } else {
    wsClient.subscribeAll(servers.value);
  }
  isWsConnected.value = true;
};

onMounted(async () => {
  try {
    const cfg = await apiClient.getConfig();
    siteConfig.value = cfg;
    initLanguage(cfg?.default_language);
    if (cfg.site_title) {
      document.title = `${cfg.site_title} | Grafana`;
    }
    if (cfg.frontend_ws_timeout_minutes) {
      wsClient.setTimeoutMinutes(cfg.frontend_ws_timeout_minutes);
    }
  } catch (e) {
    // continue
  }

  await fetchData(false);

  // Setup WS updates
  wsClient.onUpdate((serverId, partial) => {
    const idx = servers.value.findIndex(s => s.id === serverId);
    if (idx !== -1) {
      servers.value[idx] = { ...servers.value[idx], ...partial };
    }
    if (currentServer.value && currentServer.value.id === serverId) {
      // Append to live history if needed
      if (partial.cpu !== undefined || partial.ram_used !== undefined) {
        currentHistory.value.push({
          timestamp: Date.now(),
          cpu: partial.cpu,
          ram_used: partial.ram_used,
          net_in_speed: partial.net_in_speed,
          net_out_speed: partial.net_out_speed,
          disk: partial.disk
        });
        if (currentHistory.value.length > 180) {
          currentHistory.value.shift();
        }
      }
    }
  });

  wsClient.onTimeout(() => {
    showTimeoutAlert.value = true;
    isWsConnected.value = false;
  });

  syncSubscriptions();
  handleIntervalChange(3);
});

watch(() => route.path, () => {
  syncSubscriptions();
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  wsClient.closeAll();
});
</script>
