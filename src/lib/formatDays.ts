import type { TFunction } from 'i18next';

export function formatDays(days: number, t: TFunction): string {
	if (days <= 0) return t('common.lessThanOneDay');
	const years = Math.floor(days / 365);
	const months = Math.floor((days % 365) / 30);
	const remainingDays = (days % 365) % 30;
	const parts: string[] = [];
	if (years > 0) parts.push(t('common.year', { count: years }));
	if (months > 0) parts.push(t('common.monthCount', { count: months }));
	if (remainingDays > 0 && years === 0) parts.push(t('common.dayCount', { count: remainingDays }));
	return parts.join(' ') || t('common.lessThanOneDay');
}
