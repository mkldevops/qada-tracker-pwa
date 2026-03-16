import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRAYER_CONFIG } from '@/constants/prayers';
import { useProximitySensor } from '@/hooks/useProximitySensor';
import { type SessionOrder, useDebts, usePrayerStore } from '@/stores/prayerStore';
import type { Objective, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

type Phase = 'setup' | 'active' | 'complete';

const PRESETS = [5, 10, 15, 20];

function computeTarget(obj: Objective | null): number {
	if (!obj) return 10;
	if (obj.period === 'daily') return obj.target;
	if (obj.period === 'weekly') return Math.round(obj.target / 7);
	if (obj.period === 'monthly') return Math.round(obj.target / 30);
	return 10;
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };
const springBouncy = { type: 'spring' as const, stiffness: 600, damping: 20 };

function NumberPicker({
	value,
	dir,
	onChange,
}: {
	value: number;
	dir: 1 | -1;
	onChange: (v: number) => void;
}) {
	const accumulated = useRef(0);
	const valueRef = useRef(value);
	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	return (
		<motion.div
			className="flex flex-col items-center gap-3 py-8 cursor-ns-resize select-none touch-none"
			onPan={(_, info) => {
				accumulated.current -= info.delta.y;
				const step = 10;
				if (Math.abs(accumulated.current) >= step) {
					const delta = Math.sign(accumulated.current) as 1 | -1;
					onChange(Math.max(1, valueRef.current + delta));
					accumulated.current -= delta * step;
				}
			}}
			onPanEnd={() => {
				accumulated.current = 0;
			}}
		>
			<div className="overflow-hidden flex items-center" style={{ height: 110 }}>
				<AnimatePresence mode="popLayout" custom={dir}>
					<motion.span
						key={value}
						custom={dir}
						variants={{
							enter: (d: number) => ({ y: d > 0 ? 48 : -48, opacity: 0, scale: 0.8 }),
							center: { y: 0, opacity: 1, scale: 1 },
							exit: (d: number) => ({ y: d > 0 ? -48 : 48, opacity: 0, scale: 0.8 }),
						}}
						initial="enter"
						animate="center"
						exit="exit"
						transition={springBouncy}
						className="tabular-nums leading-none"
						style={{
							color: '#F5F5F0',
							fontSize: 96,
							fontFamily: "ui-monospace, 'SF Mono', monospace",
						}}
					>
						{value}
					</motion.span>
				</AnimatePresence>
			</div>
			<motion.p
				className="text-xs tracking-widest"
				style={{ color: '#3A3A3C' }}
				animate={{ opacity: [0.4, 1, 0.4] }}
				transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
			>
				↕
			</motion.p>
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

function AnimatedCounter({ value, target }: { value: number; target: number }) {
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
			<div className="flex items-end gap-1 tabular-nums">
				<motion.span
					key={display}
					className="text-[72px] font-light leading-none"
					style={{ color: '#F5F5F0' }}
					initial={{ opacity: 0.5, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={spring}
				>
					{display}
				</motion.span>
				<span className="text-2xl font-light mb-2" style={{ color: '#4A4A4C' }}>
					/ {target}
				</span>
			</div>

			{/* Progress bar */}
			<div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#2A2A2C' }}>
				<motion.div
					className="h-full rounded-full"
					style={{ background: 'linear-gradient(90deg, #C9A962, #8B7845)' }}
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
	const { t } = useTranslation();

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
				{cfg.labelFr}
			</motion.p>
			<p className="text-3xl relative" style={{ color: `${cfg.hex}AA` }}>
				{cfg.labelAr}
			</p>
			<p className="text-sm relative" style={{ color: '#6E6E70' }}>
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

	const defaultTarget = computeTarget(activeObjective);

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
		const t = computeTarget(activeObjective);
		if (t === target) return;
		setTargetDir(t >= target ? 1 : -1);
		setTarget(t);
	}, [activeObjective, userEdited, phase, target]);
	const [prayerOrder, setPrayerOrder] = useState<PrayerName[]>([...PRAYER_NAMES]);
	const [completed, setCompleted] = useState(0);
	const [currentPrayerIndex, setCurrentPrayerIndex] = useState(0);
	const [sessionId] = useState(`session-${Date.now()}`);
	const [confirmQuit, setConfirmQuit] = useState(false);
	const [pressing, setPressing] = useState(false);
	const [sujoodCount, setSujoodCount] = useState<0 | 1>(0);
	const busyRef = useRef(false);
	const wakeLockRef = useRef<WakeLockSentinel | null>(null);

	const sensorState = useProximitySensor(
		phase === 'active',
		() => {
			navigator.vibrate?.(100);
			setSujoodCount(1);
		},
		() => {
			navigator.vibrate?.([50, 50, 150]);
			setSujoodCount(0);
			handleAutoIncrement();
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

	function handleStart() {
		const order = getSortedPrayerOrder(debts, sessionOrder);
		setPrayerOrder(order);
		const next = getNextPrayer(debts, order, 0);
		if (!next) {
			setPhase('complete');
			return;
		}
		setCurrentPrayerIndex(next.index);
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

			setCompleted((prev) => {
				const newCompleted = prev + 1;
				if (newCompleted >= target) {
					setPhase('complete');
				}
				return newCompleted;
			});

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

	const handleDone = () => handleIncrement(true);
	const handleAutoIncrement = () => handleIncrement(false);

	const currentEntry =
		phase === 'active' ? getNextPrayer(debts, prayerOrder, currentPrayerIndex) : null;
	const cfg = currentEntry ? PRAYER_CONFIG[currentEntry.prayer] : null;

	return (
		<motion.div
			className="fixed inset-0 z-50 flex flex-col"
			style={{ background: '#1A1A1C' }}
			initial={{ y: '100%' }}
			animate={{ y: 0 }}
			exit={{ y: '100%' }}
			transition={{ type: 'spring', stiffness: 350, damping: 35 }}
		>
			<AnimatePresence mode="wait">
				{phase === 'setup' && (
					<motion.div
						key="setup"
						className="flex flex-1 flex-col px-7 pt-14"
						initial={{ opacity: 0, x: 40 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -40 }}
						transition={spring}
					>
						<motion.div
							className="mb-10 flex flex-col items-center gap-1 text-center"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.05, ...spring }}
						>
							<h2 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
								{t('session.newSession')}
							</h2>
							<p className="text-sm" style={{ color: '#6E6E70' }}>
								{t('session.setupSubtitle')}
							</p>
						</motion.div>

						<motion.div
							className="mb-8 grid grid-cols-4 gap-3"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1, ...spring }}
						>
							{PRESETS.map((n, i) => {
								const selected = target === n;
								return (
									<motion.button
										key={n}
										onClick={() => changeTarget(n)}
										className="rounded-2xl py-4 text-lg font-semibold tabular-nums"
										style={
											selected
												? { background: '#C9A962', color: '#1A1A1C' }
												: { background: '#242426', color: '#F5F5F0', border: '1px solid #3A3A3C' }
										}
										whileTap={{ scale: 0.88 }}
										animate={selected ? { scale: 1.06 } : { scale: 1 }}
										transition={{ delay: i * 0.04, ...springBouncy }}
										initial={{ opacity: 0, y: 16 }}
										whileHover={{ scale: selected ? 1.06 : 1.03 }}
									>
										{n}
									</motion.button>
								);
							})}
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.18, ...spring }}
						>
							<NumberPicker value={target} dir={targetDir} onChange={changeTarget} />
						</motion.div>

						<motion.button
							onClick={handleStart}
							disabled={target === 0}
							className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px] disabled:opacity-30"
							style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
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
							style={{ color: '#6E6E70' }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							whileTap={{ scale: 0.95 }}
						>
							{t('session.cancel')}
						</motion.button>
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
							style={{ color: '#4A4A4C' }}
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
							<AnimatedCounter value={completed} target={target} />
						</motion.div>

						{sensorState.isSupported && sensorState.isActive && (
							<motion.div
								className="w-full mb-6 px-4 py-3 rounded-2xl text-center text-sm font-medium"
								style={{ background: '#242426', color: '#C9A962' }}
								initial={{ opacity: 0, y: -8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1, ...spring }}
							>
								{sujoodCount === 0 ? t('session.sujood1') : t('session.sujood2')}
							</motion.div>
						)}

						{!sensorState.isSupported && phase === 'active' && (
							<motion.button
								onClick={() => {
									if (sujoodCount === 0) {
										navigator.vibrate?.(100);
										setSujoodCount(1);
									} else if (!busyRef.current) {
										navigator.vibrate?.([50, 50, 150]);
										setSujoodCount(0);
										handleAutoIncrement();
									}
								}}
								className="w-full mb-6 py-5 rounded-2xl text-center font-semibold tracking-[1px]"
								style={
									sujoodCount === 0
										? { background: '#242426', border: '1px solid #3A3A3C', color: '#C9A962' }
										: { background: '#C9A962', color: '#1A1A1C' }
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

						<AnimatePresence mode="wait">
							<PrayerCard key={currentEntry.prayer} prayer={currentEntry.prayer} cfg={cfg} />
						</AnimatePresence>

						<motion.button
							onClick={handleDone}
							disabled={pressing}
							className="w-full rounded-[28px] py-5 text-base font-semibold tracking-[1.5px] mt-8 relative overflow-hidden"
							style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
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
										<p className="text-sm" style={{ color: '#6E6E70' }}>
											{t('session.quitConfirm')}
										</p>
										<div className="flex gap-4">
											<motion.button
												onClick={onClose}
												className="px-5 py-2 rounded-2xl text-sm font-medium"
												style={{ background: '#3A3A3C', color: '#F5F5F0' }}
												whileTap={{ scale: 0.93 }}
											>
												{t('session.quit')}
											</motion.button>
											<motion.button
												onClick={() => setConfirmQuit(false)}
												className="px-5 py-2 rounded-2xl text-sm font-medium"
												style={{ background: '#242426', color: '#6E6E70' }}
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
										style={{ color: '#4A4A4C' }}
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
								<CheckCircle2 size={80} style={{ color: '#C9A962' }} />
							</motion.div>
						</motion.div>

						{/* Radiating ring */}
						<motion.div
							className="absolute w-32 h-32 rounded-full"
							style={{ border: '2px solid #C9A96240' }}
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 2.5, opacity: 0 }}
							transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
						/>
						<motion.div
							className="absolute w-32 h-32 rounded-full"
							style={{ border: '2px solid #C9A96230' }}
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
							<h2 className="font-display text-4xl font-normal" style={{ color: '#F5F5F0' }}>
								{t('session.completed')}
							</h2>
							<motion.p
								className="text-base tabular-nums"
								style={{ color: '#6E6E70' }}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
							>
								{t('session.completedCount', { count: completed })}
							</motion.p>
						</motion.div>

						<motion.button
							onClick={onClose}
							className="mt-2 w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px]"
							style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
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
