export type Bar = { label: string; count: number; isToday: boolean };

export function aggregateWeekly(data: { date: string; count: number }[]): Bar[] {
	const today = new Date().toISOString().slice(0, 10);
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
	const today = new Date().toISOString().slice(0, 10);
	return data.map((d) => ({ label: d.date, count: d.count, isToday: d.date === today }));
}

export function formatTooltipDate(date: string, weekly: boolean): string {
	const d = new Date(`${date}T00:00:00`);
	if (weekly) {
		return `Sem. ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
	}
	return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}
