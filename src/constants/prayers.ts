import type { PrayerConfig, PrayerName } from '../types';

export const THEME = {
  bg: '#0F1419',
  bgCard: '#1A2332',
  bgCardLight: '#243447',
  text: '#E7E9EA',
  textSecondary: '#8899A6',
  accent: '#1D9BF0',
  success: '#00BA7C',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#2F3B47',
} as const;

export const PRAYER_CONFIG: Record<PrayerName, PrayerConfig> = {
  fajr: {
    labelFr: 'Fajr',
    labelAr: 'الفجر',
    color: '#F59E0B',
    icon: 'Sun',
    rakat: 2,
  },
  dhuhr: {
    labelFr: 'Dhuhr',
    labelAr: 'الظهر',
    color: '#3B82F6',
    icon: 'Sun',
    rakat: 4,
  },
  asr: {
    labelFr: 'Asr',
    labelAr: 'العصر',
    color: '#F97316',
    icon: 'Sunset',
    rakat: 4,
  },
  maghrib: {
    labelFr: 'Maghrib',
    labelAr: 'المغرب',
    color: '#EF4444',
    icon: 'CloudMoon',
    rakat: 3,
  },
  isha: {
    labelFr: 'Isha',
    labelAr: 'العشاء',
    color: '#8B5CF6',
    icon: 'Moon',
    rakat: 4,
  },
};
