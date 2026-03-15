import { describe, expect, it } from 'vitest';
import type { PrayerDebt, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';
import { computeTarget, getNextPrayer } from './sessionUtils';

// ─── computeTarget ────────────────────────────────────────────────────────────

describe('computeTarget', () => {
	const makeObj = (period: 'daily' | 'weekly' | 'monthly', target: number) => ({
		period,
		target,
		is_active: 1 as const,
		created_at: '',
	});

	it('returns 10 when objective is null', () => {
		expect(computeTarget(null)).toBe(10);
	});

	it('daily: returns target, minimum 1', () => {
		expect(computeTarget(makeObj('daily', 15))).toBe(15);
		expect(computeTarget(makeObj('daily', 1))).toBe(1);
		expect(computeTarget(makeObj('daily', 0))).toBe(1); // Math.max(1, 0)
	});

	it('weekly: returns Math.max(1, round(target / 7))', () => {
		expect(computeTarget(makeObj('weekly', 7))).toBe(1);
		expect(computeTarget(makeObj('weekly', 70))).toBe(10);
		expect(computeTarget(makeObj('weekly', 49))).toBe(7);
		expect(computeTarget(makeObj('weekly', 10))).toBe(1); // round(10/7) = 1
		expect(computeTarget(makeObj('weekly', 3))).toBe(1); // round(3/7)=0 → clamped to 1
	});

	it('monthly: returns Math.max(1, round(target / 30))', () => {
		expect(computeTarget(makeObj('monthly', 30))).toBe(1);
		expect(computeTarget(makeObj('monthly', 300))).toBe(10);
		expect(computeTarget(makeObj('monthly', 450))).toBe(15);
		expect(computeTarget(makeObj('monthly', 14))).toBe(1); // round(14/30)=0 → clamped to 1
	});
});

// ─── getNextPrayer ────────────────────────────────────────────────────────────

const makeDebts = (
	remainingMap: Partial<Record<PrayerName, number>>,
): Record<PrayerName, PrayerDebt> => {
	const result = {} as Record<PrayerName, PrayerDebt>;
	for (const p of PRAYER_NAMES) {
		const remaining = remainingMap[p] ?? 0;
		result[p] = {
			id: 0,
			prayer: p,
			total_owed: remaining,
			total_completed: 0,
			remaining,
			created_at: '',
			updated_at: '',
		};
	}
	return result;
};

describe('getNextPrayer', () => {
	it('returns null when all debts are 0', () => {
		expect(getNextPrayer(makeDebts({}), 0)).toBeNull();
	});

	it('returns the prayer at fromIndex when it has remaining debt', () => {
		const result = getNextPrayer(makeDebts({ fajr: 5 }), 0);
		expect(result).toEqual({ prayer: 'fajr', index: 0 });
	});

	it('skips prayers with remaining=0 and finds the next one', () => {
		const result = getNextPrayer(makeDebts({ dhuhr: 3 }), 0);
		expect(result).toEqual({ prayer: 'dhuhr', index: 1 });
	});

	it('wraps around from the end of the list back to the start', () => {
		const result = getNextPrayer(makeDebts({ fajr: 2 }), 4); // fromIndex=4 is 'isha'
		expect(result).toEqual({ prayer: 'fajr', index: 0 });
	});

	it('returns the prayer at fromIndex when multiple have remaining', () => {
		const result = getNextPrayer(makeDebts({ fajr: 1, dhuhr: 1 }), 1);
		expect(result).toEqual({ prayer: 'dhuhr', index: 1 });
	});

	it('returns null when only prayer at fromIndex had remaining and it is now 0', () => {
		const result = getNextPrayer(makeDebts({}), 2);
		expect(result).toBeNull();
	});
});
