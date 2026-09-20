/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * 格式化网络/IO速率
 */
export function formatSpeed(bps: number): string {
  if (!bps || bps <= 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bps) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bps / Math.pow(k, idx)).toFixed(1))} ${sizes[idx]}`;
}

/**
 * 将开机时间戳或毫秒格式化为 Grafana 风格：'6 d 13:12:27'
 */
export function formatUptime(bootTime: string | number): string {
  if (!bootTime) return '0 d 00:00:00';
  const bootTs = typeof bootTime === 'string' ? parseInt(bootTime, 10) : bootTime;
  if (isNaN(bootTs) || bootTs <= 0) return '0 d 00:00:00';

  let diff = Math.floor((Date.now() - bootTs) / 1000);
  if (diff < 0) diff = 0;

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${days} d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * 规范：旗帜图标走 /flags/<code>.svg
 */
export function getFlagUrl(region?: string): string {
  if (!region) return '/flags/un.svg';
  return `/flags/${region.toLowerCase()}.svg`;
}

/**
 * 规范：OS 图标走 /os-icons/<filename>
 */
export function getOsIconUrl(osString?: string): string {
  if (!osString) return '/os-icons/linux.svg';
  const str = osString.toLowerCase();
  if (str.includes('ubuntu')) return '/os-icons/ubuntu.svg';
  if (str.includes('debian')) return '/os-icons/debian.svg';
  if (str.includes('arch')) return '/os-icons/archlinux.svg';
  if (str.includes('centos')) return '/os-icons/centos.svg';
  if (str.includes('fedora')) return '/os-icons/fedora.svg';
  if (str.includes('alpine')) return '/os-icons/alpine.svg';
  if (str.includes('windows')) return '/os-icons/windows.svg';
  if (str.includes('darwin') || str.includes('mac') || str.includes('apple')) return '/os-icons/apple.svg';
  if (str.includes('freebsd')) return '/os-icons/freebsd.svg';
  if (str.includes('armbian')) return '/os-icons/armbian.svg';
  if (str.includes('rocky')) return '/os-icons/rocky.svg';
  if (str.includes('alma')) return '/os-icons/almalinux.svg';
  return '/os-icons/linux.svg';
}

/**
 * 判断服务器是否在线（心跳阈值通常为 5 分钟 = 300,000 ms）
 */
export function isServerOnline(server: { last_updated?: number; timestamp?: number; is_online?: boolean }): boolean {
  if (server.is_online !== undefined) return !!server.is_online;
  const updateTime = server.last_updated || server.timestamp || 0;
  if (!updateTime) return false;
  return Date.now() - updateTime < 5 * 60 * 1000;
}
