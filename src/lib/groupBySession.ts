import type { PrayerLog } from '@/types';

export type SessionGroup = {
	sessionId: string | null;
	date: string;
	entries: PrayerLog[];
};

export function groupBySession(logs: PrayerLog[]): SessionGroup[] {
	const groups: SessionGroup[] = [];
	for (const log of logs) {
		const last = groups[groups.length - 1];
		if (last && last.sessionId != null && last.sessionId === log.session_id) {
			last.entries.push(log);
		} else {
			groups.push({ sessionId: log.session_id, date: log.logged_at, entries: [log] });
		}
	}
	return groups;
}
