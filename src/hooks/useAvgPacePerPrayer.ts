import { useEffect, useState } from 'react';
import { db } from '@/db/database';
import { getRecentLogs } from '@/db/queries';
import { calculateAvgPacePerPrayer } from '@/lib/calculateAvgPacePerPrayer';
import type { PrayerLog } from '@/types';

// Fetch enough recent logs to cover both windows (30 sessions × up to 20 prayers each)
const LOGS_FOR_PACE = 600;
const DAYS_WINDOW = 30;

export function useAvgPacePerPrayer(): number | null {
	const [pace, setPace] = useState<number | null>(null);
	useEffect(() => {
		const cutoffDate = new Date(Date.now() - DAYS_WINDOW * 24 * 60 * 60 * 1000).toISOString();
		Promise.all([
			getRecentLogs(db, LOGS_FOR_PACE),
			db.prayer_logs.where('logged_at').aboveOrEqual(cutoffDate).toArray(),
		])
			.then(([recent, windowed]: [PrayerLog[], PrayerLog[]]) => {
				const seen = new Set<string>();
				const merged: PrayerLog[] = [];
				for (const log of [...recent, ...windowed]) {
					const key =
						log.id !== undefined
							? `id:${log.id}`
							: `${log.logged_at}_${log.session_id}_${log.prayer}`;
					if (seen.has(key)) continue;
					seen.add(key);
					merged.push(log);
				}
				setPace(calculateAvgPacePerPrayer(merged));
			})
			.catch(() => {});
	}, []);
	return pace;
}
