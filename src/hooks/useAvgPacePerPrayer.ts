import { useEffect, useState } from 'react';
import { db } from '@/db/database';
import { getRecentLogs } from '@/db/queries';
import { calculateAvgPacePerPrayer } from '@/lib/calculateAvgPacePerPrayer';

const LOGS_FOR_PACE = 200;

export function useAvgPacePerPrayer(): number | null {
	const [pace, setPace] = useState<number | null>(null);
	useEffect(() => {
		getRecentLogs(db, LOGS_FOR_PACE)
			.then((logs) => setPace(calculateAvgPacePerPrayer(logs)))
			.catch(() => {});
	}, []);
	return pace;
}
