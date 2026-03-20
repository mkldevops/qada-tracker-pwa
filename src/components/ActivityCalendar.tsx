import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/db/database';
import { getActivityByDay } from '@/db/queries';

const WEEKS = 16;
const DAYS_TOTAL = WEEKS * 7;

function getColor(count: number, isFuture: boolean): string {
	if (isFuture) return 'transparent';
	if (count === 0) return '#2A2A2C';
	if (count < 5) return '#3D6B3D';
	if (count < 10) return '#5A8F5A';
	if (count < 20) return '#6E9E6E';
	return '#C9A962';
}

export function ActivityCalendar() {
	const { t, i18n } = useTranslation();
	const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());
	const [selected, setSelected] = useState<{ date: string; count: number } | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		getActivityByDay(db, DAYS_TOTAL).then(setActivityMap);
	}, []);

	useEffect(() => {
		function onPointerDown(e: PointerEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setSelected(null);
			}
		}
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, []);

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayDow = (today.getDay() + 6) % 7; // 0=Mon, 6=Sun
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - todayDow - (WEEKS - 1) * 7);

	// Build cells[week][dow]
	const cells: Array<Array<{ date: string; count: number; isFuture: boolean }>> = [];
	for (let week = 0; week < WEEKS; week++) {
		const weekCells = [];
		for (let dow = 0; dow < 7; dow++) {
			const d = new Date(startDate);
			d.setDate(startDate.getDate() + week * 7 + dow);
			const isFuture = d > today;
			const dateStr = d.toISOString().slice(0, 10);
			weekCells.push({ date: dateStr, count: activityMap.get(dateStr) ?? 0, isFuture });
		}
		cells.push(weekCells);
	}

	const hasData = cells.some((week) => week.some((cell) => !cell.isFuture && cell.count > 0));

	// Month labels: show month abbrev at the first week of each month
	const monthLabels: (string | null)[] = Array(WEEKS).fill(null);
	for (let week = 0; week < WEEKS; week++) {
		const firstCell = cells[week][0];
		if (firstCell && !firstCell.isFuture) {
			const d = new Date(firstCell.date);
			if (d.getDate() <= 7) {
				monthLabels[week] = d.toLocaleString(i18n.language, { month: 'short' });
			}
		}
	}

	return (
		<div ref={containerRef} className="flex flex-col gap-2">
			{/* Tooltip */}
			<div style={{ minHeight: 18 }}>
				{selected && (
					<p className="text-center text-[11px]" style={{ color: '#6E6E70' }}>
						{new Date(selected.date).toLocaleDateString(i18n.language, {
							day: 'numeric',
							month: 'long',
						})}
						{' · '}
						<span style={{ color: selected.count > 0 ? '#6E9E6E' : '#4A4A4C' }}>
							{selected.count > 0
								? t('stats.activityCount', { count: selected.count })
								: t('stats.activityNone')}
						</span>
					</p>
				)}
			</div>

			{/* Month labels row */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
					gap: 3,
				}}
			>
				{monthLabels.map((label, week) => (
					<div key={cells[week][0].date} className="text-center">
						{label && (
							<span className="text-[9px] font-medium" style={{ color: '#4A4A4C' }}>
								{label}
							</span>
						)}
					</div>
				))}
			</div>

			{/* Grid: render row by row (dow=Mon..Sun), each row spans all weeks */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
					gap: 3,
				}}
			>
				{Array.from({ length: 7 }, (_, dow) =>
					Array.from({ length: WEEKS }, (_, week) => {
						const cell = cells[week][dow];
						const isSelected = selected?.date === cell.date;
						return (
							<div
								key={cell.date}
								style={{
									aspectRatio: '1',
									borderRadius: 3,
									background: getColor(cell.count, cell.isFuture),
									outline: isSelected ? '1.5px solid #C9A962' : 'none',
									cursor: cell.isFuture ? 'default' : 'pointer',
								}}
								onPointerDown={(e) => {
									if (cell.isFuture) return;
									e.stopPropagation();
									setSelected(isSelected ? null : { date: cell.date, count: cell.count });
								}}
							/>
						);
					}),
				)}
			</div>

			{!hasData && (
				<p className="text-center text-xs" style={{ color: '#4A4A4C' }}>
					{t('stats.activityEmpty')}
				</p>
			)}
		</div>
	);
}
