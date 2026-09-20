export interface DiskIoMetrics {
  read_bps: number;   // B/s
  write_bps: number;  // B/s
  read_iops: number;
  write_iops: number;
  await_ms: number;
  util: number;       // %
}

export interface LatencyWindowPoint {
  ts: number;
  ct?: number | null | false;
  cu?: number | null | false;
  cm?: number | null | false;
  bd?: number | null | false;
}

export interface GpuInfoItem {
  id: string;
  name: string;
  info: number | null;
}

export interface Server {
  id: string;
  name: string;
  server_group: string;
  tags: string;
  price: string; // "0" 或 "-1" 表示免费，空白表示未设置
  billing_cycle: string;
  auto_renewal: string;
  currency: string;
  expire_date: string;
  traffic_limit: string;
  traffic_calc_type: string;
  reset_day: number;
  report_interval: number;
  wss_report_interval: number;
  is_hidden: '0' | '1';
  sort_order: number;
  cpu: number;
  load_avg: string;
  net_in_speed: number;
  net_out_speed: number;
  net_rx: number;
  net_tx: number;
  net_rx_monthly: number;
  net_tx_monthly: number;
  processes: number;
  tcp_conn: number;
  udp_conn: number;
  ping_ct?: number | null | false;
  ping_cu?: number | null | false;
  ping_cm?: number | null | false;
  ping_bd?: number | null | false;
  ping_node_1?: number | null | false;
  ping_node_2?: number | null | false;
  ping_node_3?: number | null | false;
  ping_node_4?: number | null | false;
  loss_ct?: number | null | false;
  loss_cu?: number | null | false;
  loss_cm?: number | null | false;
  loss_bd?: number | null | false;
  loss_node_1?: number | null | false;
  loss_node_2?: number | null | false;
  loss_node_3?: number | null | false;
  loss_node_4?: number | null | false;
  ping?: LatencyWindowPoint[]; // 仅 /api/servers 的列表项返回；三网详情关闭时为空数组
  loss?: LatencyWindowPoint[]; // 仅 /api/servers 的列表项返回；三网详情关闭时为空数组
  ram_total: number;
  ram_used: number;
  swap_total: number;
  swap_used: number;
  disk_total: number;
  disk_used: number;
  disk?: DiskIoMetrics;
  cpu_cores: number;
  cpu_info: string;
  gpu_info: GpuInfoItem[] | string;
  arch: string;
  os: string;
  kernel_version: string;
  region: string;
  ip_v4: '0' | '1';
  ip_v6: '0' | '1';
  boot_time: string;
  agent_version?: string;
  last_updated: number;
  timestamp: number;
  is_online?: boolean;
  sysConfig?: SysConfig;
}

export interface Stats {
  total: number;
  online: number;
  offline: number;
  globalSpeedIn: number;
  globalSpeedOut: number;
  globalNetTx: number;
  globalNetRx: number;
}

export interface SysConfig {
  show_price?: boolean;
  show_expire?: boolean;
  show_tf?: boolean;
  show_three_net_details?: boolean;
  long_history_points?: number;
}

export interface SiteConfig {
  version: string;
  last_workers_version?: string | null;
  last_agent_version?: string | null;
  is_public: boolean;
  authorization: boolean;
  turnstile_enabled: boolean;
  turnstile_login_enabled: boolean;
  turnstile_site_key: string;
  site_title: string;
  custom_ct_name?: string;
  custom_cu_name?: string;
  custom_cm_name?: string;
  custom_bd_name?: string;
  preferred_theme?: string;
  default_language?: string;
  theme_options: Record<string, any>;
  verified: boolean;
  turnstile_verified: string | null;
  frontend_ws_timeout_minutes: number;
  long_history_points: number;
  latency_window?: {
    points: number;
    hours: number;
  };
}

export interface HistoryMetricRow extends Partial<Server> {
  timestamp: number;
  disk_read_bps?: number;
  disk_write_bps?: number;
  disk_read_iops?: number;
  disk_write_iops?: number;
  disk_await_ms?: number;
  disk_util?: number;
  disk?: DiskIoMetrics;
}

export interface WsMessage {
  type: 'hello' | 'subscribe' | 'subscribed' | 'ping' | 'pong' | 'batchUpdate';
  ts?: number;
  subscribed?: string;
  scope?: string;
  ids?: string[];
  count?: number;
  serverId?: string;
  updates?: Array<{
    serverId: string;
    samples: Array<{
      ts: number;
      data?: Partial<Server>;
      payload?: Partial<Server>;
      metrics?: Partial<Server>;
    }>;
  }>;
}
