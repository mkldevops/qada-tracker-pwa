import { describe, expect, it } from 'vitest';
import { calculateSuggestion } from './calculateSuggestion';

describe('calculateSuggestion', () => {
	it('returns null when totalRemaining is 0', () => {
		expect(calculateSuggestion(0, 'daily')).toBeNull();
		expect(calculateSuggestion(0, 'weekly')).toBeNull();
		expect(calculateSuggestion(0, 'monthly')).toBeNull();
	});

	it('calculates daily suggestion over 5-year horizon', () => {
		expect(calculateSuggestion(365 * 5, 'daily')).toBe(1);
		expect(calculateSuggestion(365 * 5 * 2, 'daily')).toBe(2);
	});

	it('calculates weekly suggestion over 5-year horizon', () => {
		expect(calculateSuggestion(52 * 5, 'weekly')).toBe(1);
		expect(calculateSuggestion(52 * 5 * 3, 'weekly')).toBe(3);
	});

	it('calculates monthly suggestion over 5-year horizon', () => {
		expect(calculateSuggestion(12 * 5, 'monthly')).toBe(1);
		expect(calculateSuggestion(12 * 5 * 4, 'monthly')).toBe(4);
	});

	it('returns minimum of 1 for very small totals', () => {
		expect(calculateSuggestion(1, 'daily')).toBe(1);
		expect(calculateSuggestion(1, 'weekly')).toBe(1);
		expect(calculateSuggestion(1, 'monthly')).toBe(1);
	});
});
