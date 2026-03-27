import type { PrayerLog } from '@/types';

export function calculateAvgPacePerPrayer(logs: PrayerLog[]): number | null {
	const sessionMap = new Map<string, PrayerLog[]>();
	for (const log of logs) {
		if (!log.session_id) continue;
		const arr = sessionMap.get(log.session_id) ?? [];
		arr.push(log);
		sessionMap.set(log.session_id, arr);
	}

	const paces: number[] = [];
	for (const entries of sessionMap.values()) {
		if (entries.length < 2) continue;
		const times = entries.map((e) => new Date(e.logged_at).getTime());
		const duration = Math.max(...times) - Math.min(...times);
		if (duration <= 0) continue;
		const totalQty = entries.reduce((sum, e) => sum + e.quantity, 0);
		if (totalQty <= 0) continue;
		paces.push(duration / totalQty);
		if (paces.length === 20) break;
	}

	if (paces.length === 0) return null;
	return paces.reduce((sum, p) => sum + p, 0) / paces.length;
}

export function formatPace(msPerPrayer: number, count: number): string {
	const totalMs = msPerPrayer * count;
	if (totalMs < 60_000) return `~${Math.max(1, Math.round(totalMs / 1000))}s`;
	return `~${Math.round(totalMs / 60_000)} min`;
}
