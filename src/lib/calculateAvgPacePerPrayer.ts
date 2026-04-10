import type { PrayerLog } from '@/types';

const MAX_SESSIONS = 30;
const DAYS_WINDOW = 30;

export function calculateAvgPacePerPrayer(logs: PrayerLog[]): number | null {
	const sessionMap = new Map<string, PrayerLog[]>();
	for (const log of logs) {
		if (!log.session_id) continue;
		const arr = sessionMap.get(log.session_id) ?? [];
		arr.push(log);
		sessionMap.set(log.session_id, arr);
	}

	const cutoff = Date.now() - DAYS_WINDOW * 24 * 60 * 60 * 1000;

	// Sort sessions most-recent first so we can apply both windows correctly
	const sessions = [...sessionMap.values()].sort((a, b) => {
		const latestA = Math.max(...a.map((e) => new Date(e.logged_at).getTime()));
		const latestB = Math.max(...b.map((e) => new Date(e.logged_at).getTime()));
		return latestB - latestA;
	});

	const paces: number[] = [];
	for (let i = 0; i < sessions.length; i++) {
		const entries = sessions[i];
		const latestTime = Math.max(...entries.map((e) => new Date(e.logged_at).getTime()));
		// Stop when both windows are exhausted
		if (i >= MAX_SESSIONS && latestTime < cutoff) break;

		if (entries.length < 2) continue;
		const times = entries.map((e) => new Date(e.logged_at).getTime());
		const duration = Math.max(...times) - Math.min(...times);
		if (duration <= 0) continue;
		const totalQty = entries.reduce((sum, e) => sum + e.quantity, 0);
		if (totalQty <= 0) continue;
		paces.push(duration / totalQty);
	}

	if (paces.length === 0) return null;
	return paces.reduce((sum, p) => sum + p, 0) / paces.length;
}

export function formatPace(msPerPrayer: number, count: number): string {
	const totalMs = msPerPrayer * count;
	if (totalMs < 60_000) return `~${Math.max(1, Math.round(totalMs / 1000))}s`;
	return `~${Math.round(totalMs / 60_000)} min`;
}
