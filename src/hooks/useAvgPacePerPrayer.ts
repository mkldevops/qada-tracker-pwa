import { useEffect, useState } from 'react';
import { db } from '@/db/database';
import { getRecentLogs } from '@/db/queries';
import { calculateAvgPacePerPrayer } from '@/lib/calculateAvgPacePerPrayer';

export function useAvgPacePerPrayer(): number | null {
	const [pace, setPace] = useState<number | null>(null);
	useEffect(() => {
		getRecentLogs(db, 200).then((logs) => setPace(calculateAvgPacePerPrayer(logs)));
	}, []);
	return pace;
}
