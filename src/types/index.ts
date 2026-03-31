export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type Period = 'daily' | 'weekly' | 'monthly';

export const PRAYER_NAMES: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface PrayerDebt {
	id: number;
	prayer: PrayerName;
	total_owed: number;
	total_completed: number;
	remaining: number;
	created_at: string;
	updated_at: string;
}

export interface PrayerLog {
	id?: number;
	prayer: PrayerName;
	quantity: number;
	logged_at: string;
	session_id: string | null;
}

export interface Objective {
	id?: number;
	period: Period;
	target: number;
	is_active: 1 | 0;
	created_at: string;
}

export interface StatsState {
	today: number;
	thisWeek: number;
	thisMonth: number;
	allTime: number;
	streak: number;
	avgPerDay: number;
	estimatedDays: number | null;
}

export interface PrayerConfig {
	labelFr: string;
	labelEn: string;
	labelAr: string;
	color: string;
	icon: string;
	rakat: number;
}

export interface BatchEntry {
	prayer: PrayerName;
	quantity: number;
}
