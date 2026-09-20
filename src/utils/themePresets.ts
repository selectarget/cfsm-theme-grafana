import { ref } from 'vue';
import { apiClient } from '../api/client';

export type ThemePresetId = 'classic' | 'cyberpunk' | 'nordic' | 'oled';

export interface ThemePreset {
  id: ThemePresetId;
  nameZh: string;
  nameEn: string;
  dotColor: string;
  accentColor: string;
  bgPreview: string;
}

export const themePresets: ThemePreset[] = [
  {
    id: 'classic',
    nameZh: '经典炭黑 (Classic)',
    nameEn: 'Grafana Classic',
    dotColor: '#73BF69',
    accentColor: '#5794F2',
    bgPreview: '#111217'
  },
  {
    id: 'cyberpunk',
    nameZh: '赛博霓虹 (Cyberpunk)',
    nameEn: 'Cyberpunk Neon',
    dotColor: '#00F5D4',
    accentColor: '#F72585',
    bgPreview: '#090b10'
  },
  {
    id: 'nordic',
    nameZh: '极夜冷灰 (Nordic)',
    nameEn: 'Nordic Slate',
    dotColor: '#88C0D0',
    accentColor: '#81A1C1',
    bgPreview: '#1a1d24'
  },
  {
    id: 'oled',
    nameZh: '纯黑深邃 (OLED)',
    nameEn: 'OLED Pure Black',
    dotColor: '#22C55E',
    accentColor: '#3B82F6',
    bgPreview: '#000000'
  }
];

export const activeTheme = ref<ThemePresetId>('classic');

export function applyTheme(themeId: ThemePresetId, saveToRemote = false) {
  activeTheme.value = themeId;
  if (typeof document !== 'undefined') {
    const body = document.body;
    body.classList.remove('theme-classic', 'theme-cyberpunk', 'theme-nordic', 'theme-oled');
    body.classList.add(`theme-${themeId}`);
  }
  localStorage.setItem('cfsm_color_theme', themeId);

  if (saveToRemote) {
    apiClient.saveThemeOptions({ color_preset: themeId }).catch(err => {
      console.warn('Could not save theme options to worker:', err);
    });
  }
}

export function initTheme(remotePreset?: string) {
  const saved = localStorage.getItem('cfsm_color_theme') as ThemePresetId;
  if (saved && themePresets.some(p => p.id === saved)) {
    applyTheme(saved, false);
    return;
  }

  if (remotePreset && themePresets.some(p => p.id === remotePreset)) {
    applyTheme(remotePreset as ThemePresetId, false);
    return;
  }

  applyTheme('classic', false);
}
