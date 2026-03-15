export function formatDays(days: number): string {
	if (days <= 0) return '< 1 jour';
	const years = Math.floor(days / 365);
	const months = Math.floor((days % 365) / 30);
	const remainingDays = days % 30;
	const parts: string[] = [];
	if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
	if (months > 0) parts.push(`${months} mois`);
	if (remainingDays > 0 && years === 0) parts.push(`${remainingDays} j`);
	return parts.join(' ') || '< 1 jour';
}
