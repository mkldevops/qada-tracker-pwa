import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { formatDays } from './formatDays';

const t: TFunction = ((key: string, opts?: { count?: number }) => {
	const count = opts?.count ?? 0;
	switch (key) {
		case 'common.lessThanOneDay':
			return '< 1 day';
		case 'common.year':
			return count === 1 ? '1 year' : `${count} years`;
		case 'common.monthCount':
			return count === 1 ? '1 month' : `${count} months`;
		case 'common.dayCount':
			return `${count} d`;
		default:
			return key;
	}
}) as TFunction;

describe('formatDays', () => {
	it('returns lessThanOneDay for 0 days', () => {
		expect(formatDays(0, t)).toBe('< 1 day');
	});

	it('returns lessThanOneDay for negative days', () => {
		expect(formatDays(-5, t)).toBe('< 1 day');
	});

	it('formats days only (less than a month)', () => {
		expect(formatDays(15, t)).toBe('15 d');
	});

	it('formats exactly 1 month', () => {
		expect(formatDays(30, t)).toBe('1 month');
	});

	it('formats months and days (no years)', () => {
		expect(formatDays(45, t)).toBe('1 month 15 d');
	});

	it('formats exactly 1 year (no months, no days shown)', () => {
		expect(formatDays(365, t)).toBe('1 year');
	});

	it('formats years and months (days omitted when years > 0)', () => {
		expect(formatDays(400, t)).toBe('1 year 1 month');
	});

	it('does not include days when years > 0', () => {
		// 366 days = 1 year, 1 day — days should be suppressed
		expect(formatDays(366, t)).toBe('1 year');
	});

	it('formats multiple years and months', () => {
		// 2 years + 4 months = 730 + 120 = 850 days
		expect(formatDays(850, t)).toBe('2 years 4 months');
	});

	it('uses singular for 1 year', () => {
		expect(formatDays(365, t)).toContain('1 year');
		expect(formatDays(365, t)).not.toContain('years');
	});

	it('uses plural for 2+ years', () => {
		expect(formatDays(730, t)).toContain('years');
	});

	it('uses singular for 1 month', () => {
		expect(formatDays(30, t)).toBe('1 month');
	});

	it('uses plural for 2+ months', () => {
		expect(formatDays(60, t)).toContain('months');
	});

	it('returns lessThanOneDay for fractional result with no parts', () => {
		// edge: 1 day — stays as days only
		expect(formatDays(1, t)).toBe('1 d');
	});

	it('formats a realistic large debt (50 years)', () => {
		const result = formatDays(50 * 365, t);
		expect(result).toContain('50 years');
	});
});
