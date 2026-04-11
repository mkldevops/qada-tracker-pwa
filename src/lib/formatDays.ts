import type { TFunction } from 'i18next';

export function prayersToDuration(prayers: number): {
	years: number;
	months: number;
	days: number;
} {
	const total = Math.ceil(prayers / 5);
	const years = Math.floor(total / 365);
	const months = Math.floor((total % 365) / 30);
	const days = (total % 365) % 30;
	return { years, months, days };
}

export function formatCatchUpLabel(prayers: number, t: TFunction): string | null {
	if (prayers <= 0) return null;
	const { years, months, days } = prayersToDuration(prayers);
	const parts: string[] = [];
	if (years > 0) parts.push(t('common.year', { count: years }));
	if (months > 0) parts.push(t('common.monthCount', { count: months }));
	if (days > 0) parts.push(t('common.dayCount', { count: days }));
	return `≈ ${parts.join(' ') || t('common.lessThanOneDay')}`;
}

export function formatDaysParts(
	days: number,
	t: TFunction,
): { value: number; unit: string }[] | null {
	if (days <= 0) return null;
	const years = Math.floor(days / 365);
	const months = Math.floor((days % 365) / 30);
	const remainingDays = (days % 365) % 30;
	const parts: { value: number; unit: string }[] = [];
	if (years > 0) parts.push({ value: years, unit: t('common.yearUnit', { count: years }) });
	if (months > 0) parts.push({ value: months, unit: t('common.monthUnit', { count: months }) });
	if (remainingDays > 0)
		parts.push({ value: remainingDays, unit: t('common.dayUnit', { count: remainingDays }) });
	return parts.length > 0 ? parts : null;
}

export function formatDays(days: number, t: TFunction): string {
	if (days <= 0) return t('common.lessThanOneDay');
	const years = Math.floor(days / 365);
	const months = Math.floor((days % 365) / 30);
	const remainingDays = (days % 365) % 30;
	const parts: string[] = [];
	if (years > 0) parts.push(t('common.year', { count: years }));
	if (months > 0) parts.push(t('common.monthCount', { count: months }));
	if (remainingDays > 0) parts.push(t('common.dayCount', { count: remainingDays }));
	return parts.join(' ') || t('common.lessThanOneDay');
}
