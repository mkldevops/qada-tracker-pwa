export type Bar = { label: string; count: number; isToday: boolean };

function getLocalDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function aggregateWeekly(data: { date: string; count: number }[]): Bar[] {
	const today = getLocalDateString(new Date());
	const bars: Bar[] = [];
	for (let i = data.length; i > 0; i -= 7) {
		const chunk = data.slice(Math.max(0, i - 7), i);
		const count = chunk.reduce((sum, d) => sum + d.count, 0);
		const isToday = chunk.some((d) => d.date === today);
		bars.unshift({ label: chunk[0].date, count, isToday });
	}
	return bars;
}

export function aggregateDaily(data: { date: string; count: number }[]): Bar[] {
	const today = getLocalDateString(new Date());
	return data.map((d) => ({ label: d.date, count: d.count, isToday: d.date === today }));
}

export function formatTooltipDate(date: string, weekly: boolean): string {
	const d = new Date(`${date}T00:00:00`);
	if (weekly) {
		return `Sem. ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
	}
	return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}
