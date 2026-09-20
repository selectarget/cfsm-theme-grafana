import type { SiteConfig, Server, Stats, SysConfig, HistoryMetricRow } from '../types';
import { mockSiteConfig, mockServers, mockStats, generateMockHistory } from './mock';

export class ApiClient {
  private apiBases: string[] = [];
  private token: string | null = null;
  private turnstileVerified: string | null = null;
  public isMockMode = false;

  constructor() {
    this.initApiBases();
    this.token = localStorage.getItem('cfsm_jwt') || localStorage.getItem('jwt_token');
    this.turnstileVerified = sessionStorage.getItem('cfsm_turnstile_verified');
  }

  private initApiBases() {
    const meta = document.querySelector('meta[name="apiBase"]');
    if (meta) {
      const content = meta.getAttribute('content');
      if (content) {
        this.apiBases = content.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (this.apiBases.length === 0) {
      if (window.location.protocol.startsWith('http')) {
        this.apiBases = [window.location.origin];
      } else {
        // file:// 协议或特殊环境使用空
        this.apiBases = [];
      }
    }
  }

  public getBases(): string[] {
    return this.apiBases;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('cfsm_jwt', token);
    } else {
      localStorage.removeItem('cfsm_jwt');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setTurnstileVerified(verified: string | null) {
    this.turnstileVerified = verified;
    if (verified) {
      sessionStorage.setItem('cfsm_turnstile_verified', verified);
    } else {
      sessionStorage.removeItem('cfsm_turnstile_verified');
    }
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.turnstileVerified) {
      headers['X-Turnstile-Verified'] = this.turnstileVerified;
    }
    return headers;
  }

  async getConfig(): Promise<SiteConfig> {
    if (this.apiBases.length === 0) {
      this.isMockMode = true;
      return mockSiteConfig;
    }

    try {
      const base = this.apiBases[0];
      const res = await fetch(`${base}/api/config`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SiteConfig = await res.json();
      if (data.turnstile_verified) {
        this.setTurnstileVerified(data.turnstile_verified);
      }
      this.isMockMode = false;
      return data;
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch /api/config, falling back to mock:', err);
      this.isMockMode = true;
      return mockSiteConfig;
    }
  }

  async saveThemeOptions(options: Record<string, any>): Promise<Record<string, any>> {
    if (this.apiBases.length === 0 || this.isMockMode) {
      console.log('[Mock] Saved theme options:', options);
      return options;
    }

    const base = this.apiBases[0];
    const res = await fetch(`${base}/api/theme_options`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ theme_options: options })
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'saveThemeOptionsFailed');
    }
    return result.theme_options;
  }

  async getServers(): Promise<{
    servers: Server[];
    stats: Stats;
    regionStats?: Record<string, number>;
    sysConfig?: SysConfig;
  }> {
    if (this.apiBases.length === 0 || this.isMockMode) {
      this.isMockMode = true;
      return {
        servers: mockServers,
        stats: mockStats,
        regionStats: { CN: 1, HK: 1, JP: 1, US: 1 },
        sysConfig: {
          show_price: true,
          show_expire: true,
          show_tf: true,
          show_three_net_details: true
        }
      };
    }

    try {
      const results = await Promise.all(
        this.apiBases.map(async (base) => {
          const res = await fetch(`${base}/api/servers`, {
            headers: this.getHeaders()
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        })
      );

      // 合并多 base 的服务器
      const allServers: Server[] = [];
      let total = 0;
      let online = 0;
      let offline = 0;
      let globalSpeedIn = 0;
      let globalSpeedOut = 0;
      let globalNetTx = 0;
      let globalNetRx = 0;
      const regionStats: Record<string, number> = {};
      let sysConfig: SysConfig = {};

      results.forEach((r, idx) => {
        if (r.servers && Array.isArray(r.servers)) {
          // 给服务器打上所在源站标记
          r.servers.forEach((s: Server) => {
            (s as any).__apiBase = this.apiBases[idx];
          });
          allServers.push(...r.servers);
        }
        if (r.stats) {
          total += r.stats.total || 0;
          online += r.stats.online || 0;
          offline += r.stats.offline || 0;
          globalSpeedIn += r.stats.globalSpeedIn || 0;
          globalSpeedOut += r.stats.globalSpeedOut || 0;
          globalNetTx += r.stats.globalNetTx || 0;
          globalNetRx += r.stats.globalNetRx || 0;
        }
        if (r.regionStats) {
          for (const [k, v] of Object.entries(r.regionStats)) {
            regionStats[k] = (regionStats[k] || 0) + (v as number);
          }
        }
        if (r.sysConfig) {
          sysConfig = { ...sysConfig, ...r.sysConfig };
        }
      });

      return {
        servers: allServers,
        stats: {
          total: total || allServers.length,
          online: online || allServers.filter(s => s.is_online !== false).length,
          offline: offline,
          globalSpeedIn,
          globalSpeedOut,
          globalNetTx,
          globalNetRx
        },
        regionStats,
        sysConfig
      };
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch /api/servers, falling back to mock:', err);
      this.isMockMode = true;
      return {
        servers: mockServers,
        stats: mockStats,
        regionStats: { CN: 1, HK: 1, JP: 1, US: 1 },
        sysConfig: {
          show_price: true,
          show_expire: true,
          show_tf: true,
          show_three_net_details: true
        }
      };
    }
  }

  async getServer(id: string, apiBaseHint?: string): Promise<Server> {
    if (this.isMockMode || this.apiBases.length === 0) {
      const found = mockServers.find(s => s.id === id);
      return found || mockServers[0];
    }

    const bases = apiBaseHint ? [apiBaseHint, ...this.apiBases.filter(b => b !== apiBaseHint)] : this.apiBases;
    let lastError: any = null;

    for (const base of bases) {
      try {
        const res = await fetch(`${base}/api/server?id=${encodeURIComponent(id)}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const s = await res.json();
          (s as any).__apiBase = base;
          return s;
        }
      } catch (err) {
        lastError = err;
      }
    }

    console.warn(`[ApiClient] Could not fetch server ${id}, fallback to mock:`, lastError);
    const found = mockServers.find(s => s.id === id);
    return found || mockServers[0];
  }

  async getHistory(id: string, hours: number = 24, apiBaseHint?: string): Promise<HistoryMetricRow[]> {
    if (this.isMockMode || this.apiBases.length === 0) {
      return generateMockHistory(hours);
    }

    const bases = apiBaseHint ? [apiBaseHint, ...this.apiBases.filter(b => b !== apiBaseHint)] : this.apiBases;

    for (const base of bases) {
      try {
        const res = await fetch(`${base}/api/history/all?id=${encodeURIComponent(id)}&hours=${hours}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch (err) {
        // continue
      }
    }

    return generateMockHistory(hours);
  }
}

export const apiClient = new ApiClient();
