import type { Objective, PrayerDebt, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

const DEFAULT_TARGET = 10;

export function computeTarget(obj: Objective | null, sessionsPerDay = 1): number {
	if (!obj) return DEFAULT_TARGET;
	const safe = Math.max(1, sessionsPerDay);
	switch (obj.period) {
		case 'daily':
			return Math.max(1, Math.ceil(Math.max(1, obj.target) / safe));
		case 'weekly':
			return Math.max(1, Math.ceil(Math.max(1, Math.round(obj.target / 7)) / safe));
		case 'monthly':
			return Math.max(1, Math.ceil(Math.max(1, Math.round(obj.target / 30)) / safe));
	}
}

export function getNextPrayer(
	debts: Record<PrayerName, PrayerDebt>,
	fromIndex: number,
): { prayer: PrayerName; index: number } | null {
	for (let i = 0; i < PRAYER_NAMES.length; i++) {
		const idx = (fromIndex + i) % PRAYER_NAMES.length;
		const prayer = PRAYER_NAMES[idx];
		if ((debts[prayer]?.remaining ?? 0) > 0) {
			return { prayer, index: idx };
		}
	}
	return null;
}
