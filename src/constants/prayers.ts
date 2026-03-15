import type { PrayerConfig, PrayerName } from '../types';

export const PRAYER_CONFIG: Record<PrayerName, PrayerConfig & { hex: string }> = {
	fajr: {
		labelFr: 'Fajr',
		labelAr: 'الفجر',
		color: '#C9A962',
		hex: '#C9A962',
		icon: 'Sun',
		rakat: 2,
	},
	dhuhr: {
		labelFr: 'Dhuhr',
		labelAr: 'الظهر',
		color: '#6B9FD4',
		hex: '#6B9FD4',
		icon: 'Sun',
		rakat: 4,
	},
	asr: {
		labelFr: 'Asr',
		labelAr: 'العصر',
		color: '#E8874A',
		hex: '#E8874A',
		icon: 'Sunset',
		rakat: 4,
	},
	maghrib: {
		labelFr: 'Maghrib',
		labelAr: 'المغرب',
		color: '#D45F5F',
		hex: '#D45F5F',
		icon: 'CloudMoon',
		rakat: 3,
	},
	isha: {
		labelFr: 'Isha',
		labelAr: 'العشاء',
		color: '#9B72CF',
		hex: '#9B72CF',
		icon: 'Moon',
		rakat: 4,
	},
};
