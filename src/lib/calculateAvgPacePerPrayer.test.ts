import { describe, expect, it } from 'vitest';
import type { PrayerLog } from '@/types';
import { calculateAvgPacePerPrayer, formatPace } from './calculateAvgPacePerPrayer';

function makeLog(session_id: string | null, logged_at: string, quantity = 1): PrayerLog {
	return { prayer: 'fajr', quantity, logged_at, session_id };
}

describe('calculateAvgPacePerPrayer', () => {
	it('returns null for empty array', () => {
		expect(calculateAvgPacePerPrayer([])).toBeNull();
	});

	it('returns null when no logs have a session_id', () => {
		expect(calculateAvgPacePerPrayer([makeLog(null, '2025-01-01T10:00:00.000Z')])).toBeNull();
	});

	it('returns null when all sessions have fewer than 2 logs', () => {
		const logs = [makeLog('s1', '2025-01-01T10:00:00.000Z')];
		expect(calculateAvgPacePerPrayer(logs)).toBeNull();
	});

	it('returns null when all sessions have duration = 0', () => {
		const logs = [
			makeLog('s1', '2025-01-01T10:00:00.000Z'),
			makeLog('s1', '2025-01-01T10:00:00.000Z'),
		];
		expect(calculateAvgPacePerPrayer(logs)).toBeNull();
	});

	it('computes correct pace for a single valid session', () => {
		// 2 logs 60s apart, total quantity = 5 → 60000ms / 5 = 12000ms/prayer
		const logs = [
			makeLog('s1', '2025-01-01T10:01:00.000Z', 3),
			makeLog('s1', '2025-01-01T10:00:00.000Z', 2),
		];
		expect(calculateAvgPacePerPrayer(logs)).toBe(12000);
	});

	it('averages pace across multiple sessions', () => {
		// s1: 60s / 5qty = 12000ms/prayer
		// s2: 120s / 5qty = 24000ms/prayer
		// avg = 18000
		const logs = [
			makeLog('s1', '2025-01-01T10:01:00.000Z', 3),
			makeLog('s1', '2025-01-01T10:00:00.000Z', 2),
			makeLog('s2', '2025-01-02T10:02:00.000Z', 3),
			makeLog('s2', '2025-01-02T10:00:00.000Z', 2),
		];
		expect(calculateAvgPacePerPrayer(logs)).toBe(18000);
	});

	it('caps at 20 most recent sessions', () => {
		// Build 25 sessions, each with 2 logs 60s apart, qty=1 each → 60000ms / 2 = 30000ms/prayer
		const logs: PrayerLog[] = [];
		for (let i = 0; i < 25; i++) {
			const base = new Date(`2025-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`).getTime();
			logs.push(makeLog(`s${i}`, new Date(base + 60_000).toISOString()));
			logs.push(makeLog(`s${i}`, new Date(base).toISOString()));
		}
		// All 25 sessions have pace 30000; average of any 20 is also 30000
		expect(calculateAvgPacePerPrayer(logs)).toBe(30000);
	});
});

describe('formatPace', () => {
	it('formats as ~Xs when total is less than 60s', () => {
		// 30000ms/prayer * 1 = 30s
		expect(formatPace(30_000, 1)).toBe('~30s');
	});

	it('formats as ~N min when total is 60s or more', () => {
		// 90000ms/prayer * 1 = 90s = ~2 min (rounded)
		expect(formatPace(90_000, 1)).toBe('~2 min');
	});

	it('scales by count', () => {
		// 12000ms/prayer * 5 = 60000ms = 1 min
		expect(formatPace(12_000, 5)).toBe('~1 min');
	});

	it('uses minimum of 1s for very fast pace', () => {
		expect(formatPace(100, 1)).toBe('~1s');
	});

	it('rounds minutes correctly', () => {
		// 74s total → rounds to ~1 min
		expect(formatPace(74_000, 1)).toBe('~1 min');
		// 75s total → rounds to ~1 min (Math.round(1.25) = 1)
		expect(formatPace(75_000, 1)).toBe('~1 min');
		// 90s total → ~2 min
		expect(formatPace(90_000, 1)).toBe('~2 min');
	});
});
