import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/db/database';
import { getDebtEvolution } from '@/db/queries';

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
	const [days, setDays] = useState(() => {
		const stored = Number(localStorage.getItem(CHART_PERIOD_KEY));
		return PERIODS.some((p) => p.days === stored) ? stored : 30;
	});
	const [data, setData] = useState<{ date: string; remaining: number }[]>([]);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let ignore = false;
		localStorage.setItem(CHART_PERIOD_KEY, String(days));
		setHoveredIndex(null);
		getDebtEvolution(db, days).then((result) => {
			if (!ignore) setData(result);
		});
		return () => {
			ignore = true;
		};
	}, [days]);

	useEffect(() => {
		function handleClick(e: PointerEvent) {
			if (chartRef.current && !chartRef.current.contains(e.target as Node)) {
				setHoveredIndex(null);
			}
		}
		document.addEventListener('pointerdown', handleClick);
		return () => document.removeEventListener('pointerdown', handleClick);
	}, []);

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
				const y = SVG_HEIGHT - PADDING - ((d.remaining - minRemaining) / range) * CHART_HEIGHT * 0.8;
				return { ...d, x, y, i };
			})
		: [];

	const pathData = points
		.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
		.join(' ');

	const fillPath =
		points.length > 0
			? `${pathData} L ${points[points.length - 1].x} ${SVG_HEIGHT - PADDING} L ${points[0].x} ${SVG_HEIGHT - PADDING} Z`
			: '';

	return (
		<div className="flex flex-col gap-3">
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

			<div ref={chartRef} className="relative">
				<AnimatePresence>
					{hoveredIndex !== null && points[hoveredIndex] && (
						<motion.div
							key={`tooltip-${hoveredIndex}`}
							className="absolute -top-10 z-10 flex flex-col items-center"
							style={{
								left: `${(hoveredIndex / points.length) * 100}%`,
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
						<defs>
							<linearGradient id="debtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style={{ stopColor: '#6E9E6E', stopOpacity: 0.3 }} />
								<stop offset="100%" style={{ stopColor: '#6E9E6E', stopOpacity: 0 }} />
							</linearGradient>
						</defs>

						{fillPath && (
							<path
								d={fillPath}
								fill="url(#debtGradient)"
								strokeWidth="0"
							/>
						)}

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
									key={`point-${i}`}
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
					</svg>
				) : (
					<div className="flex h-48 items-center justify-center" style={{ color: '#4A4A4C' }}>
						<p className="text-xs">{t('stats.debtEvolutionEmpty')}</p>
					</div>
				)}
			</div>
		</div>
	);
}
