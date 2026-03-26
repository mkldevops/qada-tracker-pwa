import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PeriodSelector } from '@/components/PeriodSelector';
import { db } from '@/db/database';
import { getLogsByPeriod } from '@/db/queries';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { usePersistedPeriod } from '@/hooks/usePersistedPeriod';
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
	const { t, i18n } = useTranslation();
	const [days, setDays] = usePersistedPeriod(CHART_PERIOD_KEY, PERIODS);
	const [data, setData] = useState<{ date: string; count: number }[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let ignore = false;
		setSelectedIndex(null);
		getLogsByPeriod(db, days).then((result) => {
			if (!ignore) setData(result);
		});
		return () => {
			ignore = true;
		};
	}, [days]);

	useOutsideClick(chartRef, () => setSelectedIndex(null));

	const weekly = days > 30;
	const bars = weekly ? aggregateWeekly(data) : aggregateDaily(data);
	const maxCount = Math.max(...bars.map((b) => b.count), 1);
	const hasData = bars.some((b) => b.count > 0);

	return (
		<div className="flex flex-col gap-3 rounded-[20px] px-4 py-4 bg-surface border border-border">
			<PeriodSelector periods={PERIODS} activeDays={days} onSelect={setDays} />

			<div ref={chartRef} className="relative">
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
							<div className="rounded-xl px-3 py-1.5 text-center bg-border">
								<p className="text-[10px] font-medium text-foreground">
									{t('stats.prayerCount', { count: bars[selectedIndex].count })}
								</p>
								<p className="text-[9px] text-muted">
									{formatTooltipDate(bars[selectedIndex].label, weekly, i18n.language)}
								</p>
							</div>
							<div className="h-1.5 w-[1px] bg-border" />
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
										aria-label={`${t('stats.prayerCount', { count: bar.count })}, ${formatTooltipDate(bar.label, weekly, i18n.language)}`}
										className="flex-1 cursor-pointer rounded-t-[2px] border-0 p-0"
										style={{
											background: isHighlighted ? 'var(--gold)' : 'var(--border)',
											minHeight: 2,
										}}
										initial={{ height: '0%', opacity: 0.4 }}
										animate={{
											height: `${heightPct}%`,
											opacity: 1,
											background: isHighlighted ? 'var(--gold)' : 'var(--border)',
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
					<div className="flex h-24 items-center justify-center pt-10 text-tertiary">
						<p className="text-xs">{t('stats.noPrayersInPeriod')}</p>
					</div>
				)}
			</div>
		</div>
	);
}
