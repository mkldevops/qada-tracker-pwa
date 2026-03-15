import type { Objective, PrayerDebt, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

export function computeTarget(obj: Objective | null): number {
	if (!obj) return 10;
	if (obj.period === 'daily') return obj.target;
	if (obj.period === 'weekly') return Math.round(obj.target / 7);
	if (obj.period === 'monthly') return Math.round(obj.target / 30);
	return 10;
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
