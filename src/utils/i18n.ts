import { ref, computed } from 'vue';

export type Language = 'zh' | 'en';

export const currentLang = ref<Language>('zh');

export const messages = {
  zh: {
    // 导航
    home: '首页',
    dashboards: '仪表盘',
    overview: '概览看板',
    telemetry: '深度遥测',
    allGroups: '所有分组',
    filterPlaceholder: '搜索服务器、IP、标签...',
    demoBadge: '演示预览',
    admin: '管理后台',
    fullscreen: '全屏',

    // 时间与刷新
    last10m: '最近 10 分钟',
    last30m: '最近 30 分钟',
    last1h: '最近 1 小时',
    last6h: '最近 6 小时',
    last12h: '最近 12 小时',
    last24h: '最近 24 小时',
    last7d: '最近 7 天',
    refreshNow: '立即刷新',
    off: '关闭',

    // 首页面板
    totalNodes: '节点总数',
    totalSystems: '受监控系统',
    onlineStatus: '在线状态',
    activeHealthy: '正常运行',
    offlineNodes: '离线节点',
    unreachable: '无法连通',
    globalDownload: '全局下载速率',
    aggregatedRx: '实时下行',
    globalUpload: '全局上传速率',
    aggregatedTx: '实时上行',
    totalTraffic: '月度累计流量',
    combinedFlow: '进出总和',
    clusterThroughput: '集群网络吞吐趋势 (RX / TX)',
    latencyOverview: '多线路延时概览',
    nodeMatrix: '节点矩阵',
    instances: '台服务器',

    // 详情页面板
    nodeMemoryUsage: '内存使用率 (%)',
    memoryHistory: '内存历史趋势',
    memoryTiming: '内存时序与延迟',
    memoryFreq: '时钟频率',
    systemPowerMetrics: '系统电源指标',
    swapUsage: 'Swap / 虚拟内存 (%)',
    hostUptime: '主机运行时间',
    hostCpuFreq: '各核心频率',
    cpuUsage: 'CPU 使用率 (%)',
    serverSystemUptime: '系统运行时间',
    cpuFreqDist: '核心频率分布',
    cpuPower: 'CPU 封装功耗',
    cpuVoltage: '核心电压',
    agentUptime: '探针在线时间',
    coreFreqArm: '处理器核心频率',
    coreUtilization: '核心独立负载 (%)',
    systemTemp: '硬件系统温度 (°C)',
    networkLatency: '网络三网探测延时 (Ping RTT)',
    auxCoreLoads: '辅助核心负载 (%)',
    gpuUsage: 'GPU / 显存占用 (%)',
    gpuVoltage: '显卡供电电压',
    gpuFanPower: '显卡风扇与功耗',
    energyConsumption: '综合电量功耗趋势',
    partitionUsage: '磁盘分区水位 (%)',
    diskTemp: '存储磁盘温度 (°C)',
    driveHealth: '驱动器健康状态 (%)',
    diskUsageMirror: '磁盘读写镜像 (Write / Read)',
    bandwidthMirror: '网络吞吐镜像 (Download / Upload)',

    // 图例与单位
    available: '可用',
    used: '已用',
    reserved: '保留',
    online: '在线',
    offline: '离线',
    live: '实时',
    sensors: '传感器',
    todaySoFar: '今日累计',
    timeoutNotice: '实时订阅已按后台设定的超时时长主动断开以节省额度，当前显示最后一次快照。',
    reconnect: '继续连接',
    loading: '正在载入 Grafana 遥测指标...',
    ct: '中国电信',
    cu: '中国联通',
    cm: '中国移动',
    bgp: '多线 BGP'
  },
  en: {
    // Nav
    home: 'Home',
    dashboards: 'Dashboards',
    overview: 'Overview',
    telemetry: 'Telemetry',
    allGroups: 'All Groups',
    filterPlaceholder: 'Filter by name, IP, tag...',
    demoBadge: 'DEMO PREVIEW',
    admin: 'Admin',
    fullscreen: 'Fullscreen',

    // Time & Refresh
    last10m: 'Last 10 minutes',
    last30m: 'Last 30 minutes',
    last1h: 'Last 1 hour',
    last6h: 'Last 6 hours',
    last12h: 'Last 12 hours',
    last24h: 'Last 24 hours',
    last7d: 'Last 7 days',
    refreshNow: 'Refresh Now',
    off: 'Off',

    // Home panels
    totalNodes: 'Total Nodes',
    totalSystems: 'Monitored Systems',
    onlineStatus: 'Online Status',
    activeHealthy: 'Active & Healthy',
    offlineNodes: 'Offline Nodes',
    unreachable: 'Unreachable',
    globalDownload: 'Global Download',
    aggregatedRx: 'Realtime RX',
    globalUpload: 'Global Upload',
    aggregatedTx: 'Realtime TX',
    totalTraffic: 'Total Traffic',
    combinedFlow: 'Combined Flow',
    clusterThroughput: 'Cluster Network Throughput (RX / TX)',
    latencyOverview: 'Multi-line Latency Overview',
    nodeMatrix: 'Node Matrix',
    instances: 'instances',

    // Detail panels
    nodeMemoryUsage: 'Node Memory Usage (%)',
    memoryHistory: 'Memory History',
    memoryTiming: 'Memory Timing & Latency',
    memoryFreq: 'Memory Frequency',
    systemPowerMetrics: 'System Power Metrics',
    swapUsage: 'Swap / Secondary Memory (%)',
    hostUptime: 'Host Uptime',
    hostCpuFreq: 'Host CPU Frequency',
    cpuUsage: 'CPU Usage (%)',
    serverSystemUptime: 'Server System Uptime',
    cpuFreqDist: 'CPU Frequency Distribution',
    cpuPower: 'CPU Package Power',
    cpuVoltage: 'CPU Core Voltage',
    agentUptime: 'Agent Uptime',
    coreFreqArm: 'Core Frequency (ARM)',
    coreUtilization: 'Core Utilization (%)',
    systemTemp: 'System Temperature (°C)',
    networkLatency: 'Network Route Latency (Ping RTT)',
    auxCoreLoads: 'Auxiliary Core Loads (%)',
    gpuUsage: 'GPU / VRAM Usage (%)',
    gpuVoltage: 'GPU Voltage',
    gpuFanPower: 'GPU Fan & Power',
    energyConsumption: 'Energy Consumption & Power Flow',
    partitionUsage: 'Partition Usage (%)',
    diskTemp: 'Disk Temperature (°C)',
    driveHealth: 'Drive Health Status (%)',
    diskUsageMirror: 'Disk Usage (Write / Read)',
    bandwidthMirror: 'Bandwidth Usage (Download / Upload)',

    // Legends & status
    available: 'Available',
    used: 'Used',
    reserved: 'Reserved',
    online: 'Online',
    offline: 'Offline',
    live: 'Live',
    sensors: 'Sensors',
    todaySoFar: 'Today so far',
    timeoutNotice: 'Live stream suspended according to timeout config. Showing last snapshot.',
    reconnect: 'Resume Stream',
    loading: 'Loading Grafana telemetry...',
    ct: 'China Telecom',
    cu: 'China Unicom',
    cm: 'China Mobile',
    bgp: 'Multi-line BGP'
  }
};

export function initLanguage(configuredLang?: string) {
  const saved = localStorage.getItem('cfsm_lang') as Language;
  if (saved && (saved === 'zh' || saved === 'en')) {
    currentLang.value = saved;
    return;
  }

  if (configuredLang === 'zh' || configuredLang === 'en') {
    currentLang.value = configuredLang;
    return;
  }

  // 自动探测浏览器语言
  if (typeof navigator !== 'undefined') {
    const navLang = (navigator.language || '').toLowerCase();
    currentLang.value = navLang.startsWith('zh') ? 'zh' : 'en';
  }
}

export function setLanguage(lang: Language) {
  currentLang.value = lang;
  localStorage.setItem('cfsm_lang', lang);
}

export function toggleLanguage() {
  setLanguage(currentLang.value === 'zh' ? 'en' : 'zh');
}

export function t(key: keyof typeof messages['zh']): string {
  return messages[currentLang.value][key] || messages['en'][key] || (key as string);
}

export const tRef = computed(() => messages[currentLang.value]);
