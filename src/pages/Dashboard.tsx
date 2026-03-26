import { Plus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EstimationCard } from '@/components/EstimationCard';
import { Session } from '@/components/Session';
import { PRAYER_CONFIG } from '@/constants/prayers';
import { spring } from '@/lib/animations';
import { formatCatchUpLabel } from '@/lib/formatDays';
import {
	useActiveObjective,
	useDebts,
	usePrayerStore,
	useStats,
	useTotalRemaining,
} from '@/stores/prayerStore';
import type { PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

function StatPill({
	label,
	value,
	color,
	index = 0,
}: {
	label: string;
	value: string | number;
	color?: string;
	index?: number;
}) {
	return (
		<motion.div
			className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-4"
			style={{ background: '#242426', border: '1px solid #3A3A3C' }}
			initial={{ opacity: 0, scale: 0.85, y: 12 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ delay: 0.14 + index * 0.05, ...spring }}
			whileHover={{ scale: 1.03 }}
		>
			<span
				className="text-3xl font-semibold leading-none tabular-nums"
				style={{ color: color ?? '#F5F5F0' }}
			>
				{value}
			</span>
			<span className="text-[10px] font-medium" style={{ color: '#6E6E70' }}>
				{label}
			</span>
		</motion.div>
	);
}

function PrayerRow({
	prayer,
	remaining,
	totalOwed,
	totalCompleted,
	onLog,
	index = 0,
}: {
	prayer: PrayerName;
	remaining: number;
	totalOwed: number;
	totalCompleted: number;
	onLog: (p: PrayerName) => void;
	index?: number;
}) {
	const { t } = useTranslation();
	const cfg = PRAYER_CONFIG[prayer];
	const progress = totalOwed > 0 ? Math.min(100, (totalCompleted / totalOwed) * 100) : 0;
	const done = remaining === 0;
	const shouldReduce = useReducedMotion();
	const [justLogged, setJustLogged] = useState(false);
	const [justCompleted, setJustCompleted] = useState(false);
	const prevDoneRef = useRef(done);

	useEffect(() => {
		const prevDone = prevDoneRef.current;
		prevDoneRef.current = done;
		if (!prevDone && done) {
			setJustCompleted(true);
			const timer = setTimeout(() => setJustCompleted(false), 600);
			return () => clearTimeout(timer);
		}
	}, [done]);

	useEffect(() => {
		if (justLogged) {
			const timer = setTimeout(() => setJustLogged(false), 500);
			return () => clearTimeout(timer);
		}
	}, [justLogged]);

	async function handleLog() {
		try {
			await onLog(prayer);
			if (!shouldReduce) {
				setJustLogged(true);
			}
		} catch {
			console.error('Failed to log prayer');
		}
	}

	return (
		<motion.div
			className="relative flex items-center gap-4 overflow-hidden rounded-2xl px-5"
			style={{ background: '#242426', border: '1px solid #3A3A3C', height: 72 }}
			initial={{ opacity: 0, x: -16 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: 0.22 + index * 0.05, ...spring }}
		>
			<AnimatePresence>
				{justLogged && (
					<motion.div
						key="flash"
						className="pointer-events-none absolute inset-0 rounded-2xl"
						style={{ background: cfg.hex }}
						initial={{ opacity: 0.35 }}
						animate={{ opacity: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.5, ease: 'easeOut' }}
					/>
				)}
			</AnimatePresence>
			<div className="flex flex-1 flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<span className="font-display text-lg font-medium" style={{ color: cfg.hex }}>
						{cfg.labelFr}
					</span>
					<span className="text-xs" style={{ color: '#4A4A4C' }}>
						{cfg.labelAr}
					</span>
					<AnimatePresence mode="popLayout">
						<motion.span
							key={remaining}
							className="text-[11px]"
							style={{ color: '#6E6E70' }}
							initial={shouldReduce ? false : { opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={shouldReduce ? {} : { opacity: 0, y: 6 }}
							transition={{ duration: 0.18, ease: 'easeOut' }}
						>
							{t('dashboard.remaining', { count: remaining })}
						</motion.span>
					</AnimatePresence>
				</div>
				<div className="flex items-center gap-2">
					<div
						className="h-[3px] flex-1 overflow-hidden rounded-full"
						style={{ background: '#3A3A3C' }}
					>
						<motion.div
							className="h-full rounded-full"
							style={{ background: cfg.hex }}
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={{
								delay: 0.3 + index * 0.05,
								duration: 0.8,
								ease: [0.34, 1.56, 0.64, 1],
							}}
						/>
					</div>
					<span className="w-8 text-right text-[10px] tabular-nums" style={{ color: '#6E6E70' }}>
						{totalOwed === 0 ? '—' : `${Math.round(progress)}%`}
					</span>
				</div>
			</div>
			<motion.button
				type="button"
				onClick={handleLog}
				disabled={done}
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
				style={done ? { background: '#2A2A2C' } : { background: '#C9A962' }}
				animate={justCompleted && !shouldReduce ? { scale: [1, 1.35, 1] } : { scale: 1 }}
				transition={justCompleted ? { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } : spring}
				whileTap={done || shouldReduce ? {} : { scale: 0.82 }}
			>
				<Plus size={18} style={{ color: done ? '#6E6E70' : '#1A1A1C' }} />
			</motion.button>
		</motion.div>
	);
}

export function Dashboard() {
	const { t } = useTranslation();
	const { logPrayer } = usePrayerStore();
	const debts = useDebts();
	const stats = useStats();
	const activeObjective = useActiveObjective();
	const totalRemaining = useTotalRemaining();
	const [showSession, setShowSession] = useState(false);

	const catchUpLabel = formatCatchUpLabel(totalRemaining, t);

	return (
		<>
			<div className="space-y-5 px-7 pb-4 pt-1">
				<motion.div
					className="flex items-start justify-between"
					initial={{ opacity: 0, y: -12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0, ...spring }}
				>
					<div className="flex flex-col gap-0.5">
						<h1 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
							قضاء
						</h1>
						<p className="text-xs font-medium tracking-[1px]" style={{ color: '#6E6E70' }}>
							{t('dashboard.subtitle')}
						</p>
					</div>
				</motion.div>

				<motion.div
					className="relative flex w-full flex-col justify-center gap-2 overflow-hidden rounded-[20px] px-6 py-7"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)' }}
					initial={{ opacity: 0, y: 16, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ delay: 0.06, ...spring }}
				>
					<motion.div
						className="pointer-events-none absolute inset-0"
						style={{
							background:
								'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
						}}
						animate={{ x: ['-100%', '100%'] }}
						transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
					/>
					<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#1A1A1C99' }}>
						{t('dashboard.totalRemaining')}
					</p>
					<p
						className="text-[80px] font-semibold leading-[0.85] tabular-nums"
						style={{ color: '#1A1A1C' }}
					>
						{totalRemaining.toLocaleString()}
					</p>
					{catchUpLabel && (
						<p className="text-sm" style={{ color: '#1A1A1C88' }}>
							{catchUpLabel}
						</p>
					)}
				</motion.div>

				<motion.button
					type="button"
					onClick={() => setShowSession(true)}
					disabled={totalRemaining === 0}
					className="w-full rounded-[28px] py-4 font-semibold tracking-[1.5px] disabled:opacity-30"
					style={{ background: '#242426', border: '1px solid #C9A962', color: '#C9A962' }}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, ...spring }}
					whileTap={{ scale: 0.97 }}
					whileHover={{ scale: 1.01 }}
				>
					{t('dashboard.launchSession')}
				</motion.button>

				<div className="flex gap-3">
					<StatPill
						label={t('dashboard.today')}
						value={activeObjective ? `${stats.today} / ${activeObjective.target}` : stats.today}
						color="#C9A962"
						index={0}
					/>
					<AnimatePresence>
						{stats.estimatedDays !== null && (
							<EstimationCard
								key="estimation"
								estimatedDays={stats.estimatedDays}
								avgPerDay={stats.avgPerDay}
							/>
						)}
					</AnimatePresence>
				</div>

				<div className="flex flex-col gap-2.5">
					<motion.p
						className="text-[11px] font-medium tracking-[3px]"
						style={{ color: '#4A4A4C' }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.24 }}
					>
						{t('dashboard.prayers')}
					</motion.p>
					{PRAYER_NAMES.map((prayer, index) => (
						<PrayerRow
							key={prayer}
							prayer={prayer}
							remaining={debts[prayer]?.remaining ?? 0}
							totalOwed={debts[prayer]?.total_owed ?? 0}
							totalCompleted={debts[prayer]?.total_completed ?? 0}
							onLog={logPrayer}
							index={index}
						/>
					))}
				</div>
			</div>

			<AnimatePresence>
				{showSession && <Session onClose={() => setShowSession(false)} />}
			</AnimatePresence>
		</>
	);
}
