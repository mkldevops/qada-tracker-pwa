import type { Period } from '@/types';

export function calculateSuggestion(totalRemaining: number, period: Period): number | null {
	if (totalRemaining === 0) return null;
	const raw =
		period === 'daily'
			? totalRemaining / (365 * 5)
			: period === 'weekly'
				? totalRemaining / (52 * 5)
				: totalRemaining / (12 * 5);
	return Math.max(1, Math.round(raw));
}
