import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { db } from '@/db/database';
import { getLogsByPeriod } from '@/db/queries';
import { aggregateDaily, aggregateWeekly, formatTooltipDate } from '@/lib/chartUtils';

const PERIODS = [
	{ label: '7j', days: 7 },
	{ label: '15j', days: 15 },
	{ label: '30j', days: 30 },
	{ label: '3m', days: 90 },
	{ label: '6m', days: 180 },
	{ label: '9m', days: 270 },
	{ label: '12m', days: 365 },
];

const CHART_PERIOD_KEY = 'chart_period_days';
const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };

export function StatsChart() {
	const [days, setDays] = useState(() => {
		const stored = Number(localStorage.getItem(CHART_PERIOD_KEY));
		return PERIODS.some((p) => p.days === stored) ? stored : 30;
	});
	const [data, setData] = useState<{ date: string; count: number }[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let ignore = false;
		localStorage.setItem(CHART_PERIOD_KEY, String(days));
		setSelectedIndex(null);
		getLogsByPeriod(db, days).then((result) => {
			if (!ignore) setData(result);
		});
		return () => {
			ignore = true;
		};
	}, [days]);

	useEffect(() => {
		function handleClick(e: PointerEvent) {
			if (chartRef.current && !chartRef.current.contains(e.target as Node)) {
				setSelectedIndex(null);
			}
		}
		document.addEventListener('pointerdown', handleClick);
		return () => document.removeEventListener('pointerdown', handleClick);
	}, []);

	const weekly = days > 30;
	const bars = weekly ? aggregateWeekly(data) : aggregateDaily(data);
	const maxCount = Math.max(...bars.map((b) => b.count), 1);
	const hasData = bars.some((b) => b.count > 0);

	return (
		<div
			className="flex flex-col gap-3 rounded-[20px] px-4 py-4"
			style={{ background: '#242426', border: '1px solid #3A3A3C' }}
		>
			{/* Period selector */}
			<div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
				{PERIODS.map((p) => {
					const active = p.days === days;
					return (
						<motion.button
							key={p.days}
							type="button"
							onClick={() => setDays(p.days)}
							className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-semibold tracking-wide"
							style={
								active
									? { background: '#C9A962', color: '#1A1A1C' }
									: { background: '#1A1A1C', color: '#6E6E70' }
							}
							whileTap={{ scale: 0.88 }}
							animate={active ? { scale: 1.04 } : { scale: 1 }}
							transition={spring}
						>
							{p.label}
						</motion.button>
					);
				})}
			</div>

			{/* Chart */}
			<div ref={chartRef} className="relative">
				{/* Tooltip */}
				<AnimatePresence>
					{selectedIndex !== null && bars[selectedIndex] && (
						<motion.div
							key={`tooltip-${selectedIndex}`}
							className="absolute -top-10 z-10 flex flex-col items-center"
							style={{
								left: `calc(${(selectedIndex / bars.length) * 100}% + ${100 / bars.length / 2}%)`,
								transform: 'translateX(-50%)',
							}}
							initial={{ opacity: 0, y: 4, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 4, scale: 0.9 }}
							transition={spring}
						>
							<div className="rounded-xl px-3 py-1.5 text-center" style={{ background: '#3A3A3C' }}>
								<p className="text-[10px] font-medium" style={{ color: '#F5F5F0' }}>
									{bars[selectedIndex].count} prière{bars[selectedIndex].count !== 1 ? 's' : ''}
								</p>
								<p className="text-[9px]" style={{ color: '#6E6E70' }}>
									{formatTooltipDate(bars[selectedIndex].label, weekly)}
								</p>
							</div>
							<div className="h-1.5 w-[1px]" style={{ background: '#3A3A3C' }} />
						</motion.div>
					)}
				</AnimatePresence>

				{hasData ? (
					<div className="flex items-end gap-[2px] pt-10" style={{ height: 110 }}>
						<AnimatePresence mode="sync">
							{bars.map((bar, i) => {
								const heightPct = bar.count > 0 ? Math.max(4, (bar.count / maxCount) * 100) : 2;
								const isSelected = selectedIndex === i;
								const isHighlighted = bar.isToday || isSelected;
								return (
									<motion.button
										key={`${days}-${bar.label}`}
										type="button"
										aria-label={`${bar.count} prière${bar.count !== 1 ? 's' : ''}, ${formatTooltipDate(bar.label, weekly)}`}
										className="flex-1 cursor-pointer rounded-t-[2px] border-0 p-0"
										style={{
											background: isHighlighted ? '#C9A962' : '#3A3A3C',
											minHeight: 2,
										}}
										initial={{ height: '0%', opacity: 0.4 }}
										animate={{
											height: `${heightPct}%`,
											opacity: 1,
											background: isHighlighted ? '#C9A962' : '#3A3A3C',
										}}
										exit={{ height: '0%', opacity: 0 }}
										transition={{ ...spring, delay: i * 0.005 }}
										onPointerDown={(e) => {
											e.stopPropagation();
											setSelectedIndex(isSelected ? null : i);
										}}
									/>
								);
							})}
						</AnimatePresence>
					</div>
				) : (
					<div className="flex h-24 items-center justify-center pt-10" style={{ color: '#4A4A4C' }}>
						<p className="text-xs">Aucune prière sur cette période</p>
					</div>
				)}
			</div>
		</div>
	);
}
