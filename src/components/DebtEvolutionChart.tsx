import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PeriodSelector } from '@/components/PeriodSelector';
import { db } from '@/db/database';
import { getDebtEvolution } from '@/db/queries';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { usePersistedPeriod } from '@/hooks/usePersistedPeriod';

const PERIODS = [
	{ label: '7j', days: 7 },
	{ label: '30j', days: 30 },
	{ label: '3m', days: 90 },
	{ label: '6m', days: 180 },
	{ label: '12m', days: 365 },
];

const CHART_PERIOD_KEY = 'debt_evolution_period_days';
const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };

export function DebtEvolutionChart() {
	const { t } = useTranslation();
	const [days, setDays] = usePersistedPeriod(CHART_PERIOD_KEY, PERIODS);
	const [data, setData] = useState<{ date: string; remaining: number }[]>([]);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let ignore = false;
		setHoveredIndex(null);
		getDebtEvolution(db, days).then((result) => {
			if (!ignore) setData(result);
		});
		return () => {
			ignore = true;
		};
	}, [days]);

	useOutsideClick(chartRef, () => setHoveredIndex(null));

	const hasData = data.length > 0 && data.some((d) => d.remaining > 0);
	const minRemaining = hasData ? Math.min(...data.map((d) => d.remaining)) : 0;
	const maxRemaining = hasData ? Math.max(...data.map((d) => d.remaining)) : 1;
	const range = maxRemaining - minRemaining || 1;

	const SVG_WIDTH = 100;
	const SVG_HEIGHT = 200;
	const PADDING = 16;
	const CHART_HEIGHT = SVG_HEIGHT - PADDING * 2;
	const CHART_WIDTH = SVG_WIDTH - PADDING * 2;

	const points = hasData
		? data.map((d, i) => {
				const x = (i / Math.max(1, data.length - 1)) * CHART_WIDTH + PADDING;
				const y =
					SVG_HEIGHT - PADDING - ((d.remaining - minRemaining) / range) * CHART_HEIGHT * 0.8;
				return { ...d, x, y, i };
			})
		: [];

	const currentValue = hasData ? data[data.length - 1].remaining : null;
	const startValue = hasData ? data[0].remaining : null;
	const delta = currentValue !== null && startValue !== null ? currentValue - startValue : null;
	const deltaPercent =
		delta !== null && startValue !== null && startValue > 0
			? Math.round((delta / startValue) * 100)
			: null;

	const yMax = hasData
		? SVG_HEIGHT - PADDING - ((maxRemaining - minRemaining) / range) * CHART_HEIGHT * 0.8
		: 0;
	const yMin = SVG_HEIGHT - PADDING;

	const pathData = points
		.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
		.join(' ');

	const fillPath =
		points.length > 0
			? `${pathData} L ${points[points.length - 1].x} ${SVG_HEIGHT - PADDING} L ${points[0].x} ${SVG_HEIGHT - PADDING} Z`
			: '';

	return (
		<div className="flex flex-col gap-3">
			<PeriodSelector periods={PERIODS} activeDays={days} onSelect={setDays} />

			{hasData && currentValue !== null && (
				<div className="flex gap-2">
					<div
						className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2.5"
						style={{ background: '#1A1A1C', border: '1px solid #2A2A2C' }}
					>
						<span className="text-base font-semibold tabular-nums" style={{ color: '#F5F5F0' }}>
							{currentValue.toLocaleString()}
						</span>
						<span className="text-[9px] font-medium" style={{ color: '#4A4A4C' }}>
							{t('stats.current')}
						</span>
					</div>
					{delta !== null && (
						<div
							className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2.5"
							style={{ background: '#1A1A1C', border: '1px solid #2A2A2C' }}
						>
							<span
								className="text-base font-semibold tabular-nums"
								style={{ color: delta < 0 ? '#6E9E6E' : delta > 0 ? '#D45F5F' : '#6E6E70' }}
							>
								{delta > 0 ? '+' : ''}
								{delta.toLocaleString()}
							</span>
							<span className="text-[9px] font-medium" style={{ color: '#4A4A4C' }}>
								{t('stats.delta')}
							</span>
						</div>
					)}
					{delta !== null && (
						<div
							className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2.5"
							style={{ background: '#1A1A1C', border: '1px solid #2A2A2C' }}
						>
							<span
								className="text-base font-semibold tabular-nums"
								style={{
									color:
										deltaPercent === null
											? '#6E6E70'
											: deltaPercent < 0
												? '#6E9E6E'
												: deltaPercent > 0
													? '#D45F5F'
													: '#6E6E70',
								}}
							>
								{deltaPercent === null ? '—' : `${deltaPercent > 0 ? '+' : ''}${deltaPercent}%`}
							</span>
							<span className="text-[9px] font-medium" style={{ color: '#4A4A4C' }}>
								{t('stats.deltaPercent')}
							</span>
						</div>
					)}
				</div>
			)}

			<div ref={chartRef} className="relative">
				<AnimatePresence>
					{hoveredIndex !== null && points[hoveredIndex] && (
						<motion.div
							key={`tooltip-${hoveredIndex}`}
							className="absolute -top-10 z-10 flex flex-col items-center"
							style={{
								left: `${(hoveredIndex / Math.max(1, points.length - 1)) * 100}%`,
								transform: 'translateX(-50%)',
							}}
							initial={{ opacity: 0, y: 4, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 4, scale: 0.9 }}
							transition={spring}
						>
							<div className="rounded-xl px-3 py-1.5 text-center" style={{ background: '#3A3A3C' }}>
								<p className="text-[10px] font-medium" style={{ color: '#F5F5F0' }}>
									{points[hoveredIndex].remaining}
								</p>
								<p className="text-[9px]" style={{ color: '#6E6E70' }}>
									{points[hoveredIndex].date}
								</p>
							</div>
							<div className="h-1.5 w-[1px]" style={{ background: '#3A3A3C' }} />
						</motion.div>
					)}
				</AnimatePresence>

				{hasData ? (
					<svg
						viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
						className="w-full"
						style={{ height: 200 }}
					>
						<title>{t('stats.debtEvolution')}</title>
						<defs>
							<linearGradient id="debtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style={{ stopColor: '#6E9E6E', stopOpacity: 0.3 }} />
								<stop offset="100%" style={{ stopColor: '#6E9E6E', stopOpacity: 0 }} />
							</linearGradient>
						</defs>

						{fillPath && <path d={fillPath} fill="url(#debtGradient)" strokeWidth="0" />}

						{pathData && (
							<path
								d={pathData}
								stroke="#6E9E6E"
								strokeWidth="1.5"
								fill="none"
								vectorEffect="non-scaling-stroke"
							/>
						)}

						<g>
							{points.map((p, i) => (
								<circle
									key={p.date}
									cx={p.x}
									cy={p.y}
									r={hoveredIndex === i ? 3.5 : 2}
									fill={hoveredIndex === i ? '#C9A962' : '#6E9E6E'}
									className="cursor-pointer transition-all"
									onPointerDown={(e) => {
										e.stopPropagation();
										setHoveredIndex(hoveredIndex === i ? null : i);
									}}
								/>
							))}
						</g>

						{minRemaining === maxRemaining ? (
							<text x="1" y={(yMax + yMin) / 2} fontSize="5" fill="#3A3A3C" textAnchor="start">
								{minRemaining.toLocaleString()}
							</text>
						) : (
							<>
								<text x="1" y={yMax + 4} fontSize="5" fill="#3A3A3C" textAnchor="start">
									{maxRemaining.toLocaleString()}
								</text>
								<text x="1" y={yMin - 2} fontSize="5" fill="#3A3A3C" textAnchor="start">
									{minRemaining.toLocaleString()}
								</text>
							</>
						)}
					</svg>
				) : (
					<div className="flex h-48 items-center justify-center" style={{ color: '#4A4A4C' }}>
						<p className="text-xs">{t('stats.debtEvolutionEmpty')}</p>
					</div>
				)}
			</div>
			{hasData && (
				<div
					className="flex justify-between"
					style={{
						paddingLeft: `${(PADDING / SVG_WIDTH) * 100}%`,
						paddingRight: `${(PADDING / SVG_WIDTH) * 100}%`,
					}}
				>
					<span className="text-[9px] tabular-nums" style={{ color: '#4A4A4C' }}>
						{data[0].date}
					</span>
					<span className="text-[9px] tabular-nums" style={{ color: '#4A4A4C' }}>
						{data[data.length - 1].date}
					</span>
				</div>
			)}
		</div>
	);
}
