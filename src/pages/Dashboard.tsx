import { Plus, RotateCcw } from 'lucide-react';
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
			className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-surface border border-border py-4"
			initial={{ opacity: 0, scale: 0.85, y: 12 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ delay: 0.14 + index * 0.05, ...spring }}
			whileHover={{ scale: 1.03 }}
		>
			<span
				className="text-3xl font-semibold leading-none tabular-nums"
				style={{ color: color ?? 'var(--color-foreground)' }}
			>
				{value}
			</span>
			<span className="text-[10px] font-medium text-muted">{label}</span>
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
			className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-surface border border-border px-5"
			style={{ height: 72 }}
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
					<span className="text-xs text-tertiary">{cfg.labelAr}</span>
					<AnimatePresence mode="popLayout">
						<motion.span
							key={remaining}
							className="text-[11px] text-muted"
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
					<div className="h-[3px] flex-1 overflow-hidden rounded-full bg-border">
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
					<span className="w-8 text-right text-[10px] tabular-nums text-muted">
						{totalOwed === 0 ? '—' : `${Math.round(progress)}%`}
					</span>
				</div>
			</div>
			<motion.button
				type="button"
				onClick={handleLog}
				disabled={done}
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-30 ${done ? 'bg-surface-raised' : 'bg-gold'}`}
				animate={justCompleted && !shouldReduce ? { scale: [1, 1.35, 1] } : { scale: 1 }}
				transition={justCompleted ? { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } : spring}
				whileTap={done || shouldReduce ? {} : { scale: 0.82 }}
			>
				<Plus size={18} className={done ? 'text-muted' : 'text-background'} />
			</motion.button>
		</motion.div>
	);
}

export function Dashboard({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
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
						<h1 className="font-display text-3xl font-normal text-foreground">قضاء</h1>
						<p className="text-xs font-medium tracking-[1px] text-muted">
							{t('dashboard.subtitle')}
						</p>
					</div>
				</motion.div>

				<motion.div
					className="gradient-gold relative flex w-full flex-col justify-center gap-2 overflow-hidden rounded-[20px] px-6 py-7"
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
					<p className="text-[11px] font-medium tracking-[3px] text-background/60">
						{t('dashboard.totalRemaining')}
					</p>
					<p className="text-[80px] font-semibold leading-[0.85] tabular-nums text-background">
						{totalRemaining.toLocaleString()}
					</p>
					{catchUpLabel && <p className="text-sm text-background/50">{catchUpLabel}</p>}
				</motion.div>

				{totalRemaining === 0 ? (
					<motion.div
						className="flex flex-col items-center gap-6 py-8"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.12, ...spring }}
					>
						<div className="flex flex-col items-center gap-2 text-center px-4">
							<p
								className="font-display text-2xl italic"
								style={{ color: 'var(--text-secondary)' }}
							>
								{t('dashboard.allCaughtUp')}
							</p>
							<p className="text-xs text-muted leading-relaxed">{t('dashboard.allCaughtUpSub')}</p>
						</div>
						{onRestartOnboarding && (
							<motion.button
								type="button"
								onClick={onRestartOnboarding}
								className="flex items-center gap-2.5 rounded-[28px] px-6 py-4 bg-surface border border-border"
								whileTap={{ scale: 0.97 }}
								whileHover={{ scale: 1.01 }}
							>
								<RotateCcw size={15} className="text-gold" />
								<span className="text-xs font-semibold tracking-[1px] text-gold">
									{t('dashboard.reconfigure')}
								</span>
							</motion.button>
						)}
					</motion.div>
				) : (
					<>
						<motion.button
							type="button"
							onClick={() => setShowSession(true)}
							className="w-full rounded-[28px] py-4 font-semibold tracking-[1.5px] bg-surface border border-gold text-gold"
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
								color="var(--gold)"
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
								className="text-[11px] font-medium tracking-[3px] text-tertiary"
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
					</>
				)}
			</div>

			<AnimatePresence>
				{showSession && <Session onClose={() => setShowSession(false)} />}
			</AnimatePresence>
		</>
	);
}
