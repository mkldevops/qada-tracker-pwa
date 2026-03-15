import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aggregateDaily, aggregateWeekly, formatTooltipDate } from './chartUtils';

const PINNED_TODAY = '2025-06-15';
const PINNED_NOW = new Date(`${PINNED_TODAY}T12:00:00.000Z`);

function makeData(dates: string[]): { date: string; count: number }[] {
	return dates.map((date, i) => ({ date, count: i + 1 }));
}

describe('aggregateDaily', () => {
	beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: PINNED_NOW }));
	afterEach(() => vi.useRealTimers());

	it('maps each entry to a bar', () => {
		const data = makeData(['2025-06-13', '2025-06-14', PINNED_TODAY]);
		const bars = aggregateDaily(data);
		expect(bars).toHaveLength(3);
		expect(bars[0]).toEqual({ label: '2025-06-13', count: 1, isToday: false });
		expect(bars[1]).toEqual({ label: '2025-06-14', count: 2, isToday: false });
		expect(bars[2]).toEqual({ label: PINNED_TODAY, count: 3, isToday: true });
	});

	it('marks only today as isToday', () => {
		const data = makeData([PINNED_TODAY, '2025-06-14']);
		const bars = aggregateDaily(data);
		expect(bars.filter((b) => b.isToday)).toHaveLength(1);
		expect(bars[0].isToday).toBe(true);
		expect(bars[1].isToday).toBe(false);
	});

	it('returns empty array for empty input', () => {
		expect(aggregateDaily([])).toEqual([]);
	});
});

describe('aggregateWeekly', () => {
	beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: PINNED_NOW }));
	afterEach(() => vi.useRealTimers());

	function makeDays(n: number, startDate = '2025-06-01'): { date: string; count: number }[] {
		const result = [];
		for (let i = 0; i < n; i++) {
			const d = new Date(`${startDate}T00:00:00Z`);
			d.setUTCDate(d.getUTCDate() + i);
			result.push({ date: d.toISOString().slice(0, 10), count: 1 });
		}
		return result;
	}

	it('returns empty array for empty input', () => {
		expect(aggregateWeekly([])).toEqual([]);
	});

	it('groups 7 days into one bar', () => {
		const data = makeDays(7, '2025-06-09');
		const bars = aggregateWeekly(data);
		expect(bars).toHaveLength(1);
		expect(bars[0].count).toBe(7);
	});

	it('groups 14 days into two bars of 7', () => {
		const data = makeDays(14, '2025-06-02');
		const bars = aggregateWeekly(data);
		expect(bars).toHaveLength(2);
		expect(bars[0].count).toBe(7);
		expect(bars[1].count).toBe(7);
	});

	it('partial first chunk is oldest (leftmost)', () => {
		const data = makeDays(10, '2025-06-06'); // 3-day partial + 7-day full
		const bars = aggregateWeekly(data);
		expect(bars).toHaveLength(2);
		expect(bars[0].count).toBe(3); // partial oldest chunk
		expect(bars[1].count).toBe(7); // full recent week
	});

	it('marks bar with today as isToday', () => {
		const data = makeDays(7, '2025-06-09'); // ends on 2025-06-15 = PINNED_TODAY
		const bars = aggregateWeekly(data);
		expect(bars[0].isToday).toBe(true);
	});

	it('does not mark bar as isToday when today is not in chunk', () => {
		const data = makeDays(7, '2025-06-01'); // ends on 2025-06-07, before today
		const bars = aggregateWeekly(data);
		expect(bars[0].isToday).toBe(false);
	});
});

describe('formatTooltipDate', () => {
	it('formats weekly date with Sem. prefix', () => {
		const result = formatTooltipDate('2025-06-09', true);
		expect(result).toMatch(/^Sem\./);
		expect(result).toMatch(/\d/); // contains a number (day)
	});

	it('formats daily date with weekday', () => {
		const result = formatTooltipDate('2025-06-15', false);
		// French locale: short weekday + day + month
		expect(result).toMatch(/\d/);
		expect(result.length).toBeGreaterThan(3);
	});

	it('weekly and daily formats differ', () => {
		const weekly = formatTooltipDate('2025-06-09', true);
		const daily = formatTooltipDate('2025-06-09', false);
		expect(weekly).not.toBe(daily);
	});
});
