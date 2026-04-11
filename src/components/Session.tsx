import { CheckCircle2, Minus, Plus, Timer } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EncouragementMessage } from '@/components/EncouragementMessage';
import { getPrayerLabel, PRAYER_CONFIG } from '@/constants/prayers';
import { useAvgPacePerPrayer } from '@/hooks/useAvgPacePerPrayer';
import { useProximitySensor } from '@/hooks/useProximitySensor';
import { track } from '@/lib/analytics';
import { spring, springBouncy } from '@/lib/animations';
import { formatPace } from '@/lib/calculateAvgPacePerPrayer';
import { computeTarget } from '@/lib/sessionUtils';
import { type SessionOrder, useDebts, usePrayerStore } from '@/stores/prayerStore';
import type { PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

type Phase = 'setup' | 'active' | 'complete';

const pickerSpring = { type: 'spring' as const, stiffness: 320, damping: 38 };

const MAX_PICKER_VALUE = 999;

function RakatDots({ total, current, color }: { total: number; current: number; color: string }) {
	return (
		<div className="flex items-center justify-center gap-3 py-2 mb-2">
			{Array.from({ length: total }).map((_, i) => {
				const isPast = i < current;
				const isActive = i === current;
				return (
					<motion.div
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length array, items never reorder
						key={i}
						animate={
							isActive
								? { scale: [1, 1.18, 1], opacity: 1 }
								: { scale: 1, opacity: isPast ? 0.5 : 0.3 }
						}
						transition={isActive ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : spring}
						style={{
							width: isActive ? 20 : 14,
							height: isActive ? 20 : 14,
							borderRadius: '50%',
							background: isActive || isPast ? color : 'transparent',
							border: isActive || isPast ? 'none' : `2px solid ${color}`,
							boxShadow: isActive ? `0 0 10px ${color}80` : 'none',
							flexShrink: 0,
						}}
					/>
				);
			})}
		</div>
	);
}

function NumberPicker({
	value,
	dir,
	onChange,
}: {
	value: number;
	dir: 1 | -1;
	onChange: (v: number) => void;
}) {
	const { t } = useTranslation();
	const accumulated = useRef(0);
	const valueRef = useRef(value);
	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	return (
		<motion.div
			className="flex items-center gap-5 py-2 cursor-ns-resize select-none touch-none"
			onPan={(_, info) => {
				accumulated.current -= info.delta.y;
				const step = 10;
				if (Math.abs(accumulated.current) >= step) {
					const delta = Math.sign(accumulated.current) as 1 | -1;
					onChange(Math.max(1, Math.min(MAX_PICKER_VALUE, valueRef.current + delta)));
					accumulated.current -= delta * step;
				}
			}}
			onPanEnd={() => {
				accumulated.current = 0;
			}}
		>
			<motion.button
				type="button"
				aria-label={t('a11y.decrease')}
				onClick={() => onChange(Math.max(1, value - 1))}
				disabled={value <= 1}
				className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface disabled:opacity-30"
				whileTap={{ scale: 0.88 }}
				whileHover={{ scale: 1.06 }}
				transition={spring}
			>
				<Minus size={22} style={{ color: 'var(--gold)' }} />
			</motion.button>

			<div className="overflow-hidden flex items-center" style={{ height: 88, minWidth: 72 }}>
				<AnimatePresence mode="popLayout" custom={dir}>
					<motion.span
						key={value}
						custom={dir}
						variants={{
							enter: (d: number) => ({ y: d > 0 ? 48 : -48, opacity: 0, scale: 0.85 }),
							center: { y: 0, opacity: 1, scale: 1 },
							exit: (d: number) => ({ y: d > 0 ? -48 : 48, opacity: 0, scale: 0.85 }),
						}}
						initial="enter"
						animate="center"
						exit="exit"
						transition={pickerSpring}
						className="tabular-nums leading-none w-full text-center"
						style={{
							color: 'var(--text-primary)',
							fontSize: 76,
							fontFamily: "ui-monospace, 'SF Mono', monospace",
						}}
					>
						{value}
					</motion.span>
				</AnimatePresence>
			</div>

			<motion.button
				type="button"
				aria-label={t('a11y.increase')}
				onClick={() => onChange(Math.min(MAX_PICKER_VALUE, value + 1))}
				disabled={value >= MAX_PICKER_VALUE}
				className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface disabled:opacity-30"
				whileTap={{ scale: 0.88 }}
				whileHover={{ scale: 1.06 }}
				transition={spring}
			>
				<Plus size={22} style={{ color: 'var(--gold)' }} />
			</motion.button>
		</motion.div>
	);
}

function getSortedPrayerOrder(
	debts: ReturnType<typeof useDebts>,
	mode: SessionOrder,
): PrayerName[] {
	if (mode === 'chronological') return [...PRAYER_NAMES];
	return [...PRAYER_NAMES].sort((a, b) => (debts[b]?.remaining ?? 0) - (debts[a]?.remaining ?? 0));
}

function getNextPrayer(
	debts: ReturnType<typeof useDebts>,
	prayerOrder: PrayerName[],
	fromIndex: number,
): { prayer: PrayerName; index: number } | null {
	for (let i = 0; i < prayerOrder.length; i++) {
		const idx = (fromIndex + i) % prayerOrder.length;
		const prayer = prayerOrder[idx];
		if ((debts[prayer]?.remaining ?? 0) > 0) {
			return { prayer, index: idx };
		}
	}
	return null;
}

function AnimatedCounter({
	value,
	target,
	onDecrease,
	onIncrease,
}: {
	value: number;
	target: number;
	onDecrease?: () => void;
	onIncrease?: () => void;
}) {
	const { t } = useTranslation();
	const [display, setDisplay] = useState(value);
	const prevRef = useRef(value);

	useEffect(() => {
		const prev = prevRef.current;
		prevRef.current = value;
		if (prev === value) return;

		const start = performance.now();
		const duration = 400;
		const from = prev;
		const to = value;
		let rafId: number;

		function tick(now: number) {
			const t = Math.min((now - start) / duration, 1);
			const ease = 1 - (1 - t) ** 3;
			setDisplay(Math.round(from + (to - from) * ease));
			if (t < 1) rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, [value]);

	const progress = target > 0 ? value / target : 0;

	return (
		<div className="flex flex-col items-center gap-4 w-full">
			<div className="flex items-center gap-10 tabular-nums">
				<motion.button
					type="button"
					aria-label={t('a11y.decrease')}
					onClick={onDecrease}
					disabled={!onDecrease}
					className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface disabled:opacity-30"
					whileTap={{ scale: 0.88 }}
					whileHover={{ scale: 1.06 }}
					transition={spring}
				>
					<Minus size={22} style={{ color: 'var(--gold)' }} />
				</motion.button>

				<div className="flex items-end gap-2">
					<motion.span
						key={display}
						className="text-[72px] font-light leading-none"
						style={{ color: 'var(--text-primary)' }}
						initial={{ opacity: 0.5, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={spring}
					>
						{display}
					</motion.span>
					<span className="text-2xl font-light mb-2" style={{ color: 'var(--text-tertiary)' }}>
						/ {target}
					</span>
				</div>

				<motion.button
					type="button"
					aria-label={t('a11y.increase')}
					onClick={onIncrease}
					disabled={!onIncrease}
					className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface disabled:opacity-30"
					whileTap={{ scale: 0.88 }}
					whileHover={{ scale: 1.06 }}
					transition={spring}
				>
					<Plus size={22} style={{ color: 'var(--gold)' }} />
				</motion.button>
			</div>

			{/* Progress bar */}
			<div
				className="w-full h-1 rounded-full overflow-hidden"
				style={{ background: 'var(--surface-raised)' }}
			>
				<motion.div
					className="h-full rounded-full"
					style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-deep))' }}
					initial={{ width: 0 }}
					animate={{ width: `${progress * 100}%` }}
					transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
				/>
			</div>
		</div>
	);
}

function PrayerCard({
	prayer,
	cfg,
}: {
	prayer: PrayerName;
	cfg: (typeof PRAYER_CONFIG)[PrayerName];
}) {
	const { t, i18n } = useTranslation();

	return (
		<motion.div
			key={prayer}
			className="w-full rounded-[28px] flex flex-col items-center py-10 gap-3 relative overflow-hidden"
			style={{ border: `1px solid ${cfg.hex}30` }}
			initial={{ scale: 0.85, opacity: 0, y: 20 }}
			animate={{ scale: 1, opacity: 1, y: 0 }}
			exit={{ scale: 0.85, opacity: 0, y: -20 }}
			transition={springBouncy}
		>
			{/* Glow background */}
			<motion.div
				className="absolute inset-0"
				style={{
					background: `radial-gradient(ellipse at 50% 30%, ${cfg.hex}22 0%, transparent 70%)`,
				}}
				animate={{ opacity: [1, 0.5, 1] }}
				transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
			/>

			<p
				className="text-[11px] font-medium tracking-[3px] relative"
				style={{ color: `${cfg.hex}80` }}
			>
				{t('session.nextPrayer')}
			</p>
			<motion.p
				className="font-display text-5xl font-medium relative"
				style={{ color: cfg.hex }}
				layoutId="prayer-name-fr"
			>
				{getPrayerLabel(cfg, i18n.language)}
			</motion.p>
			{i18n.language !== 'ar' && (
				<p className="text-3xl relative" style={{ color: `${cfg.hex}AA` }}>
					{cfg.labelAr}
				</p>
			)}
			<p className="text-sm relative" style={{ color: 'var(--text-secondary)' }}>
				{cfg.rakat} {t('session.rakats')}
			</p>
		</motion.div>
	);
}

export function Session({ onClose }: { onClose: () => void }) {
	const { t } = useTranslation();
	const { logBatch } = usePrayerStore();
	const debts = useDebts();
	const activeObjective = usePrayerStore((s) => s.activeObjective);
	const sessionOrder = usePrayerStore((s) => s.sessionOrder);
	const sujoodTrackingEnabled = usePrayerStore((s) => s.sujoodTrackingEnabled);
	const sessionsPerDay = usePrayerStore((s) => s.sessionsPerDay);
	const setTashahdDurationMs = usePrayerStore((s) => s.setTashahdDurationMs);

	const defaultTarget = computeTarget(activeObjective, sessionsPerDay);

	const avgPace = useAvgPacePerPrayer();

	const [phase, setPhase] = useState<Phase>('setup');
	const [target, setTarget] = useState(defaultTarget);
	const [targetDir, setTargetDir] = useState<1 | -1>(1);
	const [userEdited, setUserEdited] = useState(false);

	function changeTarget(v: number) {
		setTargetDir(v >= target ? 1 : -1);
		setTarget(v);
		setUserEdited(true);
	}

	useEffect(() => {
		if (userEdited || phase !== 'setup') return;
		const t = computeTarget(activeObjective, sessionsPerDay);
		if (t === target) return;
		setTargetDir(t >= target ? 1 : -1);
		setTarget(t);
	}, [activeObjective, sessionsPerDay, userEdited, phase, target]);
	const [prayerOrder, setPrayerOrder] = useState<PrayerName[]>([...PRAYER_NAMES]);
	const [completed, setCompleted] = useState(0);
	const [currentPrayerIndex, setCurrentPrayerIndex] = useState(0);
	const [sessionId] = useState(`session-${Date.now()}`);
	const sessionStartTime = useRef<number | null>(null);
	const [confirmQuit, setConfirmQuit] = useState(false);
	const [confirmDone, setConfirmDone] = useState(false);
	const [pressing, setPressing] = useState(false);
	const [sujoodCount, setSujoodCount] = useState<0 | 1>(0);
	const [currentRakat, setCurrentRakat] = useState(0);
	const [tashahdActive, setTashahdActive] = useState(false);
	const [tashahdSecondsLeft, setTashahdSecondsLeft] = useState(0);
	const [tashahdTotalSeconds, setTashahdTotalSeconds] = useState(0);
	const tashahdStartRef = useRef<number>(0);
	const tashahdPendingRef = useRef(false);
	const autoIncrementRef = useRef<() => void>(() => {});
	const busyRef = useRef(false);
	const wakeLockRef = useRef<WakeLockSentinel | null>(null);

	function handleRakatComplete() {
		const entry = getNextPrayer(usePrayerStore.getState().debts, prayerOrder, currentPrayerIndex);
		if (!entry) return;
		const totalRakat = PRAYER_CONFIG[entry.prayer].rakat;
		const next = currentRakat + 1;
		if (next >= totalRakat) {
			if (sujoodTrackingEnabled) {
				tashahdStartRef.current = Date.now();
				tashahdPendingRef.current = true;
				setTashahdActive(true);
			} else {
				handleAutoIncrement();
			}
		} else {
			setCurrentRakat(next);
			setConfirmDone(false);
		}
	}

	const { resetSujoodCount, ...sensorState } = useProximitySensor(
		phase === 'active' && sujoodTrackingEnabled && !tashahdActive,
		() => {
			navigator.vibrate?.(100);
			setSujoodCount(1);
		},
		() => {
			navigator.vibrate?.([50, 50, 150]);
			setSujoodCount(0);
			handleRakatComplete();
		},
	);

	useEffect(() => {
		const active = { current: true };

		async function acquireWakeLock() {
			if (!('wakeLock' in navigator)) return;
			try {
				const sentinel = await navigator.wakeLock.request('screen');
				if (active.current) {
					wakeLockRef.current = sentinel;
				} else {
					sentinel.release().catch(() => {});
				}
			} catch {}
		}

		function releaseWakeLock() {
			wakeLockRef.current?.release().catch(() => {});
			wakeLockRef.current = null;
		}

		async function handleVisibilityChange() {
			if (document.visibilityState === 'visible' && active.current) {
				await acquireWakeLock();
			}
		}

		if (phase === 'active') {
			acquireWakeLock();
			document.addEventListener('visibilitychange', handleVisibilityChange);
		} else {
			releaseWakeLock();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}

		return () => {
			active.current = false;
			releaseWakeLock();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [phase]);

	function getSessionDuration() {
		return sessionStartTime.current
			? Math.round((Date.now() - sessionStartTime.current) / 1000)
			: 0;
	}

	function handleQuit() {
		track({ name: 'session_quit', data: { completed, target, duration_s: getSessionDuration() } });
		onClose();
	}

	function handleStart() {
		const order = getSortedPrayerOrder(debts, sessionOrder);
		setPrayerOrder(order);
		const next = getNextPrayer(debts, order, 0);
		if (!next) {
			setPhase('complete');
			return;
		}
		setCurrentPrayerIndex(next.index);
		sessionStartTime.current = Date.now();
		track({ name: 'session_start', data: { target, order: sessionOrder } });
		setPhase('active');
	}

	async function handleIncrement(showPressing: boolean = false) {
		if (busyRef.current) return;
		busyRef.current = true;
		try {
			const freshDebts = usePrayerStore.getState().debts;
			const current = getNextPrayer(freshDebts, prayerOrder, currentPrayerIndex);
			if (!current) {
				setPhase('complete');
				return;
			}

			if (showPressing) setPressing(true);
			await logBatch([{ prayer: current.prayer, quantity: 1 }], sessionId);
			setCurrentRakat(0);
			setSujoodCount(0);
			resetSujoodCount();
			setTashahdActive(false);
			setConfirmDone(false);

			const newCompleted = completed + 1;
			setCompleted(newCompleted);
			if (newCompleted >= target) {
				track({
					name: 'session_complete',
					data: { total: newCompleted, duration_s: getSessionDuration(), order: sessionOrder },
				});
				setPhase('complete');
			}

			const freshDebts2 = usePrayerStore.getState().debts;
			const next = getNextPrayer(
				freshDebts2,
				prayerOrder,
				(current.index + 1) % prayerOrder.length,
			);
			if (!next) {
				setPhase('complete');
				return;
			}
			setCurrentPrayerIndex(next.index);
		} finally {
			busyRef.current = false;
			if (showPressing) setPressing(false);
		}
	}

	const handleDone = () => {
		if (currentRakat > 0) {
			setConfirmDone(true);
		} else {
			handleIncrement(true);
		}
	};
	const handleAutoIncrement = () => handleIncrement(false);

	autoIncrementRef.current = handleAutoIncrement;

	useEffect(() => {
		if (!tashahdActive) return;
		const durationMs = usePrayerStore.getState().tashahdDurationMs;
		const totalSec = Math.ceil(durationMs / 1000);
		setTashahdTotalSeconds(totalSec);
		setTashahdSecondsLeft(totalSec);

		const iv = setInterval(() => {
			const remaining = Math.ceil((durationMs - (Date.now() - tashahdStartRef.current)) / 1000);
			setTashahdSecondsLeft(Math.max(0, remaining));
		}, 500);

		const to = setTimeout(() => {
			clearInterval(iv);
			if (tashahdPendingRef.current) {
				tashahdPendingRef.current = false;
				autoIncrementRef.current();
			}
		}, durationMs);

		return () => {
			clearInterval(iv);
			clearTimeout(to);
		};
	}, [tashahdActive]);

	function handleTashahdEnd() {
		if (!tashahdPendingRef.current) return;
		const elapsed = Date.now() - tashahdStartRef.current;
		const rounded = Math.round(elapsed / 1000) * 1000;
		if (rounded >= 5000 && rounded <= 300000) {
			setTashahdDurationMs(rounded);
			toast.success(t('session.tashahdDurationSaved', { seconds: Math.round(rounded / 1000) }), {
				duration: 2500,
			});
		}
		tashahdPendingRef.current = false;
		autoIncrementRef.current();
	}

	const sessionPrayersRemaining = target - completed;
	let sessionRakatsRemaining = 0;
	if (phase === 'active' && sessionPrayersRemaining > 0) {
		let count = 0;
		let i = 0;
		const maxIter = prayerOrder.length * sessionPrayersRemaining + prayerOrder.length;
		while (count < sessionPrayersRemaining && i < maxIter) {
			const prayer = prayerOrder[(currentPrayerIndex + i) % prayerOrder.length];
			if ((debts[prayer]?.remaining ?? 0) > 0) {
				sessionRakatsRemaining += PRAYER_CONFIG[prayer].rakat;
				count++;
			}
			i++;
		}
	}
	const effectiveRakatsRemaining = Math.max(0, sessionRakatsRemaining - currentRakat);

	const currentEntry =
		phase === 'active' ? getNextPrayer(debts, prayerOrder, currentPrayerIndex) : null;
	const cfg = currentEntry ? PRAYER_CONFIG[currentEntry.prayer] : null;

	return (
		<motion.div
			className="fixed inset-0 z-50 flex flex-col"
			style={{ background: 'var(--background)' }}
			initial={{ y: '100%' }}
			animate={{ y: 0 }}
			exit={{ y: '100%' }}
			transition={{ type: 'spring', stiffness: 350, damping: 35 }}
		>
			<AnimatePresence mode="wait">
				{phase === 'setup' && (
					<motion.div
						key="setup"
						className="flex flex-1 flex-col px-7 pt-6 pb-safe overflow-y-auto"
						initial={{ opacity: 0, x: 40 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -40 }}
						transition={spring}
					>
						<motion.div
							className="mb-5 flex flex-col items-center gap-1 text-center"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.05, ...spring }}
						>
							<h2
								className="font-display text-3xl font-normal"
								style={{ color: 'var(--text-primary)' }}
							>
								{t('session.newSession')}
							</h2>
							<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
								{t('session.setupSubtitle')}
							</p>
						</motion.div>

						<motion.div
							className="my-14 flex flex-col items-center"
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.18, ...spring }}
						>
							<NumberPicker value={target} dir={targetDir} onChange={changeTarget} />
							<AnimatePresence>
								{avgPace !== null && target > 0 && (
									<motion.div
										key={target}
										className="mt-3 flex items-center justify-center gap-1.5"
										initial={{ opacity: 0, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										transition={spring}
									>
										<Timer size={11} style={{ color: 'var(--gold)', opacity: 0.7 }} />
										<span
											className="text-[11px] tabular-nums font-medium"
											style={{ color: 'var(--gold)', opacity: 0.7 }}
										>
											{formatPace(avgPace, target)}
										</span>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>

						<motion.button
							onClick={handleStart}
							disabled={target === 0}
							className="gradient-gold w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px] disabled:opacity-30"
							style={{ color: 'var(--background)' }}
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.22, ...spring }}
							whileTap={{ scale: 0.95 }}
							whileHover={{ scale: 1.02 }}
						>
							{t('session.start')}
						</motion.button>

						<motion.button
							onClick={onClose}
							className="mt-5 py-2 text-sm"
							style={{ color: 'var(--text-secondary)' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							whileTap={{ scale: 0.95 }}
						>
							{t('session.cancel')}
						</motion.button>

						<div className="pb-safe">
							<EncouragementMessage />
						</div>
					</motion.div>
				)}

				{phase === 'active' && cfg && currentEntry && (
					<motion.div
						key="active"
						className="flex flex-1 flex-col items-center px-7 pt-14 pb-10"
						initial={{ opacity: 0, x: 60 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -60 }}
						transition={spring}
					>
						<motion.div
							className="mb-2 text-[11px] font-medium tracking-[3px]"
							style={{ color: 'var(--text-tertiary)' }}
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.05 }}
						>
							{t('session.progress')}
						</motion.div>

						<motion.div
							className="w-full mb-8 flex justify-center"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.08, ...spring }}
						>
							<AnimatedCounter
								value={completed}
								target={target}
								onDecrease={
									!tashahdActive && target > completed + 1 ? () => setTarget(target - 1) : undefined
								}
								onIncrease={
									!tashahdActive && target < MAX_PICKER_VALUE
										? () => setTarget(target + 1)
										: undefined
								}
							/>
						</motion.div>

						{effectiveRakatsRemaining > 0 && (
							<motion.div
								className="flex items-center justify-center gap-2 mb-4"
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.15, ...spring }}
							>
								<AnimatePresence mode="wait">
									<motion.span
										key={effectiveRakatsRemaining}
										className="text-2xl font-semibold tabular-nums"
										style={{ color: 'var(--text-primary)' }}
										initial={{ opacity: 0, y: -8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 8 }}
										transition={spring}
									>
										{effectiveRakatsRemaining.toLocaleString()}
									</motion.span>
								</AnimatePresence>
								<span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
									{t('session.rakatsRemaining')}
								</span>
							</motion.div>
						)}

						{!tashahdActive && sensorState.isSupported && sensorState.isActive && (
							<motion.div
								className="w-full mb-6 px-4 py-3 rounded-2xl text-center text-sm font-medium"
								style={{ background: 'var(--surface)', color: 'var(--gold)' }}
								initial={{ opacity: 0, y: -8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1, ...spring }}
							>
								{sujoodCount === 0 ? t('session.sujood1') : t('session.sujood2')}
							</motion.div>
						)}

						{!tashahdActive &&
							sujoodTrackingEnabled &&
							!sensorState.isSupported &&
							phase === 'active' && (
								<motion.button
									onClick={() => {
										if (sujoodCount === 0) {
											navigator.vibrate?.(100);
											setSujoodCount(1);
										} else if (!busyRef.current) {
											navigator.vibrate?.([50, 50, 150]);
											setSujoodCount(0);
											handleRakatComplete();
										}
									}}
									className="w-full mb-6 py-5 rounded-2xl text-center font-semibold tracking-[1px]"
									style={
										sujoodCount === 0
											? {
													background: 'var(--surface)',
													border: '1px solid var(--border)',
													color: 'var(--gold)',
												}
											: { background: 'var(--gold)', color: 'var(--background)' }
									}
									initial={{ opacity: 0, y: -8 }}
									animate={
										sujoodCount === 1
											? { opacity: 1, y: 0, scale: [1, 1.05, 1] }
											: { opacity: 1, y: 0, scale: 1 }
									}
									transition={
										sujoodCount === 1
											? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
											: { delay: 0.1, ...spring }
									}
									whileTap={{ scale: 0.93 }}
								>
									{sujoodCount === 0 ? t('session.manualSujood1') : t('session.manualSujood2')}
								</motion.button>
							)}

						{cfg.rakat > 1 && (
							<RakatDots total={cfg.rakat} current={currentRakat} color={cfg.hex} />
						)}

						<AnimatePresence mode="wait">
							<PrayerCard key={currentEntry.prayer} prayer={currentEntry.prayer} cfg={cfg} />
						</AnimatePresence>

						<AnimatePresence mode="wait">
							{tashahdActive ? (
								<motion.div
									key="tashahd"
									className="mt-8 w-full flex flex-col items-center gap-5"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={spring}
								>
									<div className="relative flex items-center justify-center">
										<svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
											<circle
												cx="48"
												cy="48"
												r="40"
												fill="none"
												stroke="var(--border)"
												strokeWidth="4"
											/>
											<motion.circle
												cx="48"
												cy="48"
												r="40"
												fill="none"
												stroke="var(--gold)"
												strokeWidth="4"
												strokeLinecap="round"
												strokeDasharray={2 * Math.PI * 40}
												strokeDashoffset={
													2 *
													Math.PI *
													40 *
													(1 - tashahdSecondsLeft / Math.max(1, tashahdTotalSeconds))
												}
												transform="rotate(-90 48 48)"
												transition={{ duration: 0.5, ease: 'linear' }}
											/>
										</svg>
										<span
											className="absolute text-2xl font-semibold tabular-nums"
											style={{ color: 'var(--gold)' }}
										>
											{tashahdSecondsLeft}
										</span>
									</div>
									<div className="text-center">
										<p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
											{t('session.tashahd')}
										</p>
										<p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
											{t('session.tashahdDesc')}
										</p>
									</div>
									<motion.button
										onClick={handleTashahdEnd}
										className="gradient-gold w-full rounded-[28px] py-5 text-base font-semibold tracking-[1.5px]"
										style={{
											color: 'var(--background)',
										}}
										whileTap={{ scale: 0.94 }}
										whileHover={{ scale: 1.02 }}
										transition={spring}
									>
										{t('session.tashahdEndPrayer')}
									</motion.button>
								</motion.div>
							) : confirmDone ? (
								<motion.div
									key="confirm-done"
									className="mt-8 flex flex-col items-center gap-3"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 8 }}
									transition={spring}
								>
									<p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
										{t('session.donePartialConfirm', { current: currentRakat, total: cfg.rakat })}
									</p>
									<div className="flex gap-4">
										<motion.button
											onClick={() => handleIncrement(true)}
											disabled={pressing}
											className="px-5 py-2 rounded-2xl text-sm font-medium"
											style={{ background: 'var(--gold)', color: 'var(--background)' }}
											whileTap={{ scale: 0.93 }}
										>
											{t('session.logAnyway')}
										</motion.button>
										<motion.button
											onClick={() => setConfirmDone(false)}
											className="px-5 py-2 rounded-2xl text-sm font-medium"
											style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
											whileTap={{ scale: 0.93 }}
										>
											{t('session.continue')}
										</motion.button>
									</div>
								</motion.div>
							) : (
								<motion.button
									key="done-btn"
									onClick={handleDone}
									disabled={pressing}
									className="gradient-gold w-full rounded-[28px] py-5 text-base font-semibold tracking-[1.5px] mt-8 relative overflow-hidden"
									style={{
										color: 'var(--background)',
									}}
									whileTap={{ scale: 0.94 }}
									whileHover={{ scale: 1.02 }}
									animate={pressing ? { scale: 0.96 } : { scale: 1 }}
									transition={spring}
								>
									{pressing ? (
										<motion.span
											key="loading"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="flex items-center justify-center gap-2"
										>
											<motion.span
												animate={{ rotate: 360 }}
												transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
												className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent"
											/>
										</motion.span>
									) : (
										<motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
											{t('session.done')}
										</motion.span>
									)}
								</motion.button>
							)}
						</AnimatePresence>

						<div className="mt-6">
							<AnimatePresence mode="wait">
								{confirmQuit ? (
									<motion.div
										key="confirm"
										className="flex flex-col items-center gap-3"
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 8 }}
										transition={spring}
									>
										<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
											{t('session.quitConfirm')}
										</p>
										<div className="flex gap-4">
											<motion.button
												onClick={handleQuit}
												className="px-5 py-2 rounded-2xl text-sm font-medium"
												style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
												whileTap={{ scale: 0.93 }}
											>
												{t('session.quit')}
											</motion.button>
											<motion.button
												onClick={() => setConfirmQuit(false)}
												className="px-5 py-2 rounded-2xl text-sm font-medium"
												style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
												whileTap={{ scale: 0.93 }}
											>
												{t('session.continue')}
											</motion.button>
										</div>
									</motion.div>
								) : (
									<motion.button
										key="quit-link"
										onClick={() => setConfirmQuit(true)}
										className="text-sm"
										style={{ color: 'var(--text-tertiary)' }}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										whileTap={{ scale: 0.93 }}
									>
										{t('session.quitSession')}
									</motion.button>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				)}

				{phase === 'complete' && (
					<motion.div
						key="complete"
						className="flex flex-1 flex-col items-center justify-center px-7 gap-6"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						<motion.div
							initial={{ scale: 0, rotate: -30 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
						>
							<motion.div
								animate={{ scale: [1, 1.08, 1] }}
								transition={{ delay: 0.5, duration: 0.6, ease: 'easeInOut' }}
							>
								<CheckCircle2 size={80} style={{ color: 'var(--gold)' }} />
							</motion.div>
						</motion.div>

						{/* Radiating ring */}
						<motion.div
							className="pointer-events-none absolute w-32 h-32 rounded-full"
							style={{ border: '2px solid color-mix(in srgb, var(--gold) 25%, transparent)' }}
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 2.5, opacity: 0 }}
							transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
						/>
						<motion.div
							className="pointer-events-none absolute w-32 h-32 rounded-full"
							style={{ border: '2px solid color-mix(in srgb, var(--gold) 19%, transparent)' }}
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 3.5, opacity: 0 }}
							transition={{ delay: 0.6, duration: 1.5, ease: 'easeOut' }}
						/>

						<motion.div
							className="flex flex-col items-center gap-2"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.25, ...spring }}
						>
							<h2
								className="font-display text-4xl font-normal"
								style={{ color: 'var(--text-primary)' }}
							>
								{t('session.completed')}
							</h2>
							<motion.p
								className="text-base tabular-nums"
								style={{ color: 'var(--text-secondary)' }}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
							>
								{t('session.completedCount', { count: completed })}
							</motion.p>
						</motion.div>

						<EncouragementMessage />

						<motion.button
							onClick={onClose}
							className="gradient-gold mt-2 w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px]"
							style={{ color: 'var(--background)' }}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.45, ...spring }}
							whileTap={{ scale: 0.95 }}
							whileHover={{ scale: 1.02 }}
						>
							{t('session.close')}
						</motion.button>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
