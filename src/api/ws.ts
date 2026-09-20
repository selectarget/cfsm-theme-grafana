import type { Server, WsMessage } from '../types';
import { apiClient } from './client';

export type ServerUpdateCallback = (serverId: string, partial: Partial<Server>) => void;
export type TimeoutCallback = (minutes: number) => void;

interface ConnectionContext {
  url: string;
  ws: WebSocket | null;
  serverIds: string[];
  scope: string;
}

export class WsClient {
  private connections: Map<string, ConnectionContext> = new Map();
  private onUpdateCallbacks: Set<ServerUpdateCallback> = new Set();
  private onTimeoutCallbacks: Set<TimeoutCallback> = new Set();
  private activeMode: 'all' | 'single' = 'all';
  private singleServerId: string | null = null;
  private isSuspendedByVisibility = false;
  private timeoutTimer: any = null;
  private mockIntervalTimer: any = null;
  private timeoutMinutes = 0;
  private isTimedOut = false;

  constructor() {
    this.setupVisibilityListener();
  }

  public setTimeoutMinutes(minutes: number) {
    this.timeoutMinutes = minutes;
  }

  public onUpdate(cb: ServerUpdateCallback) {
    this.onUpdateCallbacks.add(cb);
    return () => this.onUpdateCallbacks.delete(cb);
  }

  public onTimeout(cb: TimeoutCallback) {
    this.onTimeoutCallbacks.add(cb);
    return () => this.onTimeoutCallbacks.delete(cb);
  }

  private setupVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面进入后台，主动关闭节省 Worker 额度
        this.isSuspendedByVisibility = true;
        this.closeAll();
      } else {
        // 页面切回前台，恢复连接并通知
        if (this.isSuspendedByVisibility && !this.isTimedOut) {
          this.isSuspendedByVisibility = false;
          if (this.activeMode === 'all') {
            this.reconnectAll();
          } else if (this.activeMode === 'single' && this.singleServerId) {
            this.subscribeSingle(this.singleServerId);
          }
        }
      }
    });
  }

  private startTimeoutWatcher() {
    this.clearTimeoutWatcher();
    if (this.timeoutMinutes > 0) {
      const ms = this.timeoutMinutes * 60 * 1000;
      this.timeoutTimer = setTimeout(() => {
        this.isTimedOut = true;
        this.closeAll();
        this.onTimeoutCallbacks.forEach(cb => cb(this.timeoutMinutes));
      }, ms);
    }
  }

  private clearTimeoutWatcher() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  public resumeFromTimeout() {
    this.isTimedOut = false;
    if (this.activeMode === 'all') {
      this.reconnectAll();
    } else if (this.singleServerId) {
      this.subscribeSingle(this.singleServerId);
    }
  }

  private triggerUpdate(serverId: string, data: Partial<Server>) {
    this.onUpdateCallbacks.forEach(cb => cb(serverId, data));
  }

  /**
   * 列表页全量订阅
   */
  public subscribeAll(servers: Server[]) {
    this.activeMode = 'all';
    this.singleServerId = null;
    this.closeAll();

    if (apiClient.isMockMode || apiClient.getBases().length === 0) {
      this.startMockStream(servers.map(s => s.id));
      return;
    }

    this.startTimeoutWatcher();

    // 将 servers 按 apiBase 分组
    const baseMap = new Map<string, string[]>();
    const allBases = apiClient.getBases();

    allBases.forEach(base => baseMap.set(base, []));

    servers.forEach(s => {
      const base = (s as any).__apiBase || allBases[0];
      if (base) {
        if (!baseMap.has(base)) baseMap.set(base, []);
        baseMap.get(base)!.push(s.id);
      }
    });

    baseMap.forEach((ids, base) => {
      this.createConnection(base, 'all', ids);
    });
  }

  /**
   * 详情页单服务器订阅
   */
  public subscribeSingle(serverId: string, apiBaseHint?: string) {
    this.activeMode = 'single';
    this.singleServerId = serverId;
    this.closeAll();

    if (apiClient.isMockMode || apiClient.getBases().length === 0) {
      this.startMockStream([serverId]);
      return;
    }

    this.startTimeoutWatcher();

    const bases = apiClient.getBases();
    const targetBase = apiBaseHint || bases[0];
    if (targetBase) {
      this.createConnection(targetBase, serverId, [serverId]);
    }
  }

  private createConnection(apiBase: string, subscribeParam: string, ids: string[]) {
    try {
      const wsProto = apiBase.startsWith('https') ? 'wss:' : 'ws:';
      const wsHost = apiBase.replace(/^https?:\/\//, '');
      const wsUrl = new URL(`${wsProto}//${wsHost}/api/ws`);
      wsUrl.searchParams.set('subscribe', subscribeParam);

      // 跨域或配置了 token 时追加 token 参数
      const token = apiClient.getToken();
      if (token && (typeof window !== 'undefined' && wsUrl.host !== window.location.host)) {
        wsUrl.searchParams.set('token', token);
      }

      const ws = new WebSocket(wsUrl.toString());
      const ctx: ConnectionContext = {
        url: wsUrl.toString(),
        ws,
        serverIds: ids,
        scope: subscribeParam
      };
      this.connections.set(apiBase, ctx);

      ws.onopen = () => {
        // 如果是 subscribe=all，必须向通道发送 subscribe 消息提交 ids 列表
        if (subscribeParam === 'all' && ids.length > 0) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            scope: 'all',
            ids: ids.slice(0, 500)
          }));
        }
      };

      ws.onmessage = (ev) => {
        try {
          const msg: WsMessage = JSON.parse(ev.data);
          if (msg.type === 'batchUpdate' && msg.updates) {
            for (const u of msg.updates) {
              for (const s of u.samples || []) {
                const metricData = s.data || (s as any).payload || (s as any).metrics || {};
                this.triggerUpdate(u.serverId, metricData);
              }
            }
          }
        } catch (e) {
          // ignore invalid json
        }
      };

      ws.onerror = (err) => {
        console.warn(`[WsClient] WebSocket error for ${apiBase}:`, err);
      };

      ws.onclose = () => {
        ctx.ws = null;
      };
    } catch (err) {
      console.warn(`[WsClient] Failed to create WebSocket for ${apiBase}:`, err);
    }
  }

  private reconnectAll() {
    this.connections.forEach((ctx, base) => {
      this.createConnection(base, ctx.scope, ctx.serverIds);
    });
  }

  private startMockStream(serverIds: string[]) {
    this.stopMockStream();
    this.mockIntervalTimer = setInterval(() => {
      serverIds.forEach(id => {
        const deltaCpu = (Math.random() * 4 - 2);
        const deltaIn = (Math.random() * 20000 - 10000);
        const deltaOut = (Math.random() * 40000 - 20000);

        this.triggerUpdate(id, {
          cpu: Math.max(2, Math.min(98, parseFloat((15 + deltaCpu).toFixed(1)))),
          net_in_speed: Math.max(1024 * 50, 1024 * 300 + deltaIn),
          net_out_speed: Math.max(1024 * 80, 1024 * 600 + deltaOut),
          last_updated: Date.now()
        });
      });
    }, 2000);
  }

  private stopMockStream() {
    if (this.mockIntervalTimer) {
      clearInterval(this.mockIntervalTimer);
      this.mockIntervalTimer = null;
    }
  }

  public closeAll() {
    this.clearTimeoutWatcher();
    this.stopMockStream();
    this.connections.forEach(ctx => {
      if (ctx.ws) {
        ctx.ws.close();
        ctx.ws = null;
      }
    });
    this.connections.clear();
  }
}

export const wsClient = new WsClient();
