import { useEffect, useState } from 'react';

export function usePersistedPeriod(
	key: string,
	periods: { days: number }[],
	defaultDays = 30,
): [number, (days: number) => void] {
	const [days, setDays] = useState(() => {
		const stored = Number(localStorage.getItem(key));
		return periods.some((p) => p.days === stored) ? stored : defaultDays;
	});

	useEffect(() => {
		localStorage.setItem(key, String(days));
	}, [key, days]);

	return [days, setDays];
}
