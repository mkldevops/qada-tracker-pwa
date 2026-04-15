import { Check, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getPrayerLabel, PRAYER_CONFIG } from '@/constants/prayers';
import { track } from '@/lib/analytics';
import { spring } from '@/lib/animations';
import { groupBySession } from '@/lib/groupBySession';
import { usePrayerStore } from '@/stores/prayerStore';
import type { BatchEntry, PrayerLog, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

const LONG_PRESS_MS = 450;
const VIBRATE_MS = 50;

const TABS = ['logger', 'history'] as const;
type Tab = (typeof TABS)[number];

function formatDuration(sec: number): string {
	const min = Math.floor(sec / 60);
	const remSec = sec % 60;
	if (min >= 1) return remSec > 0 ? `${min} min ${remSec}s` : `${min} min`;
	return `${sec}s`;
}

const EMPTY = (): Record<PrayerName, number> =>
	Object.fromEntries(PRAYER_NAMES.map((p) => [p, 0])) as Record<PrayerName, number>;

function PrayerRow({
	prayer,
	qty,
	onChange,
	index,
}: {
	prayer: PrayerName;
	qty: number;
	onChange: (p: PrayerName, q: number) => void;
	index: number;
}) {
	const { t, i18n } = useTranslation();
	const cfg = PRAYER_CONFIG[prayer];
	const label = getPrayerLabel(cfg, i18n.language);
	const active = qty > 0;

	return (
		<motion.div
			initial={{ opacity: 0, x: -16 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.05, ...spring }}
		>
			{index > 0 && <div style={{ height: 1, background: 'var(--border-divider)' }} />}
			<div className="flex items-center gap-3 px-5" style={{ height: 70 }}>
				<div className="flex flex-1 flex-col gap-0.5">
					<span className="font-display text-lg font-medium" style={{ color: cfg.hex }}>
						{label}
					</span>
					<span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
						{cfg.labelAr} · {cfg.rakat} {t('log.rakat')}
					</span>
				</div>
				<div className="flex items-center gap-0">
					<motion.button
						onClick={() => onChange(prayer, qty - 1)}
						className="flex h-9 w-9 items-center justify-center rounded-full"
						style={{ background: 'var(--surface-raised)' }}
						whileTap={{ scale: 0.85 }}
					>
						<Minus size={14} style={{ color: 'var(--text-secondary)' }} />
					</motion.button>

					<AnimatePresence mode="popLayout">
						<motion.span
							key={qty}
							className="w-10 text-center font-display text-xl font-medium tabular-nums"
							style={{ color: active ? cfg.hex : 'var(--text-tertiary)' }}
							initial={{ opacity: 0, y: active ? -10 : 10, scale: 0.8 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: active ? 10 : -10, scale: 0.8 }}
							transition={{ type: 'spring' as const, stiffness: 600, damping: 22 }}
						>
							{qty}
						</motion.span>
					</AnimatePresence>

					<motion.button
						onClick={() => onChange(prayer, qty + 1)}
						className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
						style={active ? { background: cfg.hex } : { background: 'var(--surface-raised)' }}
						whileTap={{ scale: 0.85 }}
						animate={{ background: active ? cfg.hex : 'var(--surface-raised)' }}
						transition={{ duration: 0.15 }}
					>
						<Plus
							size={14}
							style={{ color: active ? 'var(--background)' : 'var(--text-secondary)' }}
						/>
					</motion.button>
				</div>
			</div>
		</motion.div>
	);
}

function LoggerTab({
	quantities,
	onChange,
	total,
	onLog,
}: {
	quantities: Record<PrayerName, number>;
	onChange: (p: PrayerName, q: number) => void;
	total: number;
	onLog: () => void;
}) {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col gap-5 pt-4">
			<motion.div
				className="w-full overflow-hidden rounded-[20px]"
				style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={spring}
			>
				{PRAYER_NAMES.map((prayer, i) => (
					<PrayerRow
						key={prayer}
						prayer={prayer}
						qty={quantities[prayer]}
						onChange={onChange}
						index={i}
					/>
				))}
			</motion.div>

			<motion.div
				className="flex items-center justify-between rounded-[20px] px-6"
				style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 72 }}
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.08, ...spring }}
			>
				<span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
					{t('log.totalToLog')}
				</span>
				<AnimatePresence mode="popLayout">
					<motion.span
						key={total}
						className="font-display text-2xl font-medium tabular-nums"
						style={{ color: 'var(--gold)' }}
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 8 }}
						transition={{ type: 'spring' as const, stiffness: 500, damping: 25 }}
					>
						{total > 0 ? t('log.totalCount', { count: total }) : '—'}
					</motion.span>
				</AnimatePresence>
			</motion.div>

			<motion.button
				onClick={onLog}
				disabled={total === 0}
				className="gradient-gold flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4 disabled:opacity-30"
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.12, ...spring }}
				whileTap={{ scale: 0.96 }}
				whileHover={{ scale: 1.02 }}
			>
				<Check size={18} style={{ color: 'var(--background)' }} strokeWidth={2.5} />
				<span
					className="text-[13px] font-semibold tracking-[1.5px]"
					style={{ color: 'var(--background)' }}
				>
					{t('log.confirm')}
				</span>
			</motion.button>
		</div>
	);
}

function DeleteEntrySheet({
	log,
	onConfirm,
	onClose,
}: {
	log: PrayerLog;
	onConfirm: () => void;
	onClose: () => void;
}) {
	const { t, i18n } = useTranslation();
	const cfg = PRAYER_CONFIG[log.prayer];
	const label = getPrayerLabel(cfg, i18n.language);

	return (
		<>
			<motion.div
				className="fixed inset-0 z-[60] bg-black/60"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onPointerDown={onClose}
			/>
			<motion.div
				className="fixed bottom-0 inset-x-0 z-[61] rounded-t-[28px] px-6 pt-5 flex flex-col gap-4"
				style={{
					background: 'var(--surface)',
					border: '1px solid var(--border)',
					paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)',
				}}
				initial={{ y: '100%' }}
				animate={{ y: 0 }}
				exit={{ y: '100%' }}
				transition={{ type: 'spring', stiffness: 380, damping: 36 }}
			>
				<div className="mx-auto w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />

				<div className="flex items-center gap-3 pb-1">
					<div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: cfg.hex }} />
					<span className="font-display text-xl font-medium" style={{ color: cfg.hex }}>
						{label}
					</span>
					<span className="text-base" style={{ color: `${cfg.hex}80` }}>
						{cfg.labelAr}
					</span>
					<span
						className="ms-auto tabular-nums text-sm font-medium"
						style={{ color: 'var(--text-secondary)' }}
					>
						+{log.quantity}
					</span>
				</div>

				<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
					{t('log.deleteEntryDesc')}
				</p>

				<motion.button
					onClick={onConfirm}
					className="w-full rounded-[18px] py-4 text-sm font-semibold tracking-[1px] flex items-center justify-center gap-2"
					style={{
						background: 'color-mix(in srgb, var(--danger) 8%, var(--background))',
						border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
						color: 'var(--danger)',
					}}
					whileTap={{ scale: 0.97 }}
				>
					<Trash2 size={15} />
					{t('log.deleteEntryConfirm')}
				</motion.button>

				<motion.button
					onClick={onClose}
					className="w-full rounded-[18px] py-3 text-sm font-medium mb-2"
					style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)' }}
					whileTap={{ scale: 0.97 }}
				>
					{t('log.deleteEntryCancel')}
				</motion.button>
			</motion.div>
		</>
	);
}

function HistoriqueTab({ logs, onUndo }: { logs: PrayerLog[]; onUndo: () => void }) {
	const { t, i18n } = useTranslation();
	const groups = groupBySession(logs);
	const [selectedLog, setSelectedLog] = useState<PrayerLog | null>(null);
	const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const { deleteLog } = usePrayerStore();

	useEffect(
		() => () => {
			if (pressTimer.current) clearTimeout(pressTimer.current);
		},
		[],
	);

	function startPress(log: PrayerLog) {
		endPress();
		pressTimer.current = setTimeout(() => {
			if (logs.find((l) => l.id === log.id)) {
				navigator.vibrate?.(VIBRATE_MS);
				setSelectedLog(log);
			}
		}, LONG_PRESS_MS);
	}

	function endPress() {
		if (pressTimer.current) {
			clearTimeout(pressTimer.current);
			pressTimer.current = null;
		}
	}

	async function handleDeleteConfirm() {
		if (selectedLog?.id == null) {
			toast.error(t('common.error'));
			setSelectedLog(null);
			return;
		}

		try {
			await deleteLog(selectedLog.id, selectedLog.prayer, selectedLog.quantity);
			track({ name: 'entry_deleted', data: { prayer: selectedLog.prayer } });
			setSelectedLog(null);
			toast.success(t('log.deleteEntryConfirm'));
		} catch {
			toast.error(t('common.error'));
		}
	}

	if (groups.length === 0) {
		return (
			<motion.div
				className="flex flex-1 flex-col items-center justify-center pt-20 gap-3"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.1 }}
			>
				<p className="text-3xl" style={{ color: 'var(--border)' }}>
					—
				</p>
				<p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
					{t('log.emptyHistory')}
				</p>
			</motion.div>
		);
	}

	return (
		<>
			<div className="flex flex-col gap-4 pt-4">
				<motion.div
					className="flex justify-end"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.05 }}
				>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<motion.button
								className="flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[12px] font-medium"
								style={{
									background: 'color-mix(in srgb, var(--danger) 8%, var(--background))',
									border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
									color: 'var(--danger)',
								}}
								whileTap={{ scale: 0.93 }}
							>
								<RotateCcw size={12} />
								{t('log.undoLast')}
							</motion.button>
						</AlertDialogTrigger>
						<AlertDialogContent
							style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
						>
							<AlertDialogHeader>
								<AlertDialogTitle style={{ color: 'var(--text-primary)' }}>
									{t('log.undoTitle')}
								</AlertDialogTitle>
								<AlertDialogDescription style={{ color: 'var(--text-secondary)' }}>
									{t('log.undoDesc')}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel
									style={{
										background: 'var(--surface-raised)',
										color: 'var(--text-primary)',
										border: 'none',
									}}
								>
									{t('log.undoCancel')}
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={onUndo}
									style={{ background: 'var(--danger)', color: 'var(--text-primary)' }}
								>
									{t('log.undoConfirm')}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</motion.div>

				<div className="flex flex-col gap-3">
					{groups.map((group, gi) => {
						const totalPrayers = group.entries.reduce((s, e) => s + e.quantity, 0);
						const isSession = group.sessionId?.startsWith('session-') ?? false;
						const durationSec =
							isSession && group.entries.length > 1
								? Math.max(
										0,
										Math.floor(
											(new Date(group.entries[0].logged_at).getTime() -
												new Date(group.entries[group.entries.length - 1].logged_at).getTime()) /
												1000,
										),
									)
								: 0;

						return (
							<motion.div
								key={group.sessionId ?? `solo-${gi}`}
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: gi * 0.04, ...spring }}
							>
								<div className="mb-1.5 flex items-center gap-2 px-1">
									<span
										className="text-[10px] font-medium tracking-[2px]"
										style={{ color: 'var(--border)' }}
									>
										{new Date(group.date).toLocaleString(i18n.language, {
											day: '2-digit',
											month: '2-digit',
											hour: '2-digit',
											minute: '2-digit',
										})}
									</span>
									{group.sessionId?.startsWith('session-') && (
										<span
											className="rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider"
											style={{
												background: 'color-mix(in srgb, var(--gold) 8%, transparent)',
												color: 'color-mix(in srgb, var(--gold) 50%, transparent)',
											}}
										>
											{t('log.session')}
										</span>
									)}
									<span
										className="text-[11px] font-medium tabular-nums"
										style={{ color: 'color-mix(in srgb, var(--gold) 50%, transparent)' }}
									>
										+{totalPrayers}
									</span>
									{durationSec >= 1 && (
										<span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
											{formatDuration(durationSec)}
										</span>
									)}
								</div>

								<div
									className="overflow-hidden rounded-[18px]"
									style={{
										background: 'var(--surface)',
										border: '1px solid var(--border-divider)',
									}}
								>
									{group.entries.map((log, li) => {
										const cfg = PRAYER_CONFIG[log.prayer];
										const entryLabel = getPrayerLabel(cfg, i18n.language);
										const prevEntry = group.entries[li + 1];
										const prayerDurationSec =
											isSession && prevEntry
												? Math.floor(
														(new Date(log.logged_at).getTime() -
															new Date(prevEntry.logged_at).getTime()) /
															1000,
													)
												: null;
										return (
											<div key={log.id}>
												{li > 0 && (
													<div style={{ height: 1, background: 'var(--surface-raised)' }} />
												)}
												<motion.div
													className="flex items-center justify-between px-5 py-3 select-none"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ delay: gi * 0.04 + li * 0.03 }}
													onPointerDown={() => startPress(log)}
													onPointerUp={endPress}
													onPointerCancel={endPress}
													onPointerLeave={endPress}
												>
													<div className="flex items-center gap-2.5">
														<div
															className="h-2 w-2 rounded-full flex-shrink-0"
															style={{ background: cfg.hex }}
														/>
														<span
															className="font-display text-[15px] font-medium"
															style={{ color: cfg.hex }}
														>
															{entryLabel}
														</span>
														<span className="text-xs" style={{ color: 'var(--border)' }}>
															{cfg.labelAr}
														</span>
													</div>
													<div className="flex items-center gap-2">
														{prayerDurationSec !== null && prayerDurationSec >= 1 && (
															<span
																className="text-[10px] tabular-nums"
																style={{ color: 'var(--border)' }}
															>
																{formatDuration(prayerDurationSec)}
															</span>
														)}
														<motion.span
															className="font-display text-lg font-medium tabular-nums"
															style={{ color: 'var(--gold)' }}
															initial={{ scale: 0.8, opacity: 0 }}
															animate={{ scale: 1, opacity: 1 }}
															transition={{
																delay: gi * 0.04 + li * 0.03 + 0.05,
																type: 'spring' as const,
																stiffness: 500,
																damping: 22,
															}}
														>
															+{log.quantity}
														</motion.span>
													</div>
												</motion.div>
											</div>
										);
									})}
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>

			<AnimatePresence>
				{selectedLog && (
					<DeleteEntrySheet
						log={selectedLog}
						onConfirm={handleDeleteConfirm}
						onClose={() => setSelectedLog(null)}
					/>
				)}
			</AnimatePresence>
		</>
	);
}

export function LogPrayers() {
	const { t } = useTranslation();
	const { logBatch, undoLastLog, recentLogs } = usePrayerStore();
	const [quantities, setQuantities] = useState<Record<PrayerName, number>>(EMPTY);
	const [activeTab, setActiveTab] = useState<Tab>('history');
	const [tabDir, setTabDir] = useState<1 | -1>(1);
	const prevTabRef = useRef<Tab>('history');

	const total = PRAYER_NAMES.reduce((sum, p) => sum + quantities[p], 0);

	function switchTab(tab: Tab) {
		if (tab === activeTab) return;
		const dir = TABS.indexOf(tab) > TABS.indexOf(prevTabRef.current) ? 1 : -1;
		setTabDir(dir);
		prevTabRef.current = tab;
		setActiveTab(tab);
	}

	function handleChange(prayer: PrayerName, qty: number) {
		setQuantities((prev) => ({ ...prev, [prayer]: Math.max(0, qty) }));
	}

	async function handleLog() {
		const entries: BatchEntry[] = PRAYER_NAMES.map((prayer) => ({
			prayer,
			quantity: quantities[prayer],
		}));
		const total = entries.reduce((sum, e) => sum + e.quantity, 0);
		await logBatch(entries, `batch-${Date.now()}`);
		track({ name: 'prayers_logged', data: { total } });
		setQuantities(EMPTY());
		switchTab('history');
	}

	return (
		<div className="flex flex-col px-7 pb-4 pt-1" style={{ minHeight: '100%' }}>
			{/* Header */}
			<div className="mb-5 flex flex-col gap-0.5">
				<h1 className="font-display text-3xl font-normal" style={{ color: 'var(--text-primary)' }}>
					{t('log.title')}
				</h1>
				<p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
					{t('log.subtitle')}
				</p>
			</div>

			{/* Tab bar */}
			<div
				className="relative mb-1 flex rounded-2xl p-1"
				style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
			>
				{TABS.map((tab) => (
					<button
						type="button"
						key={tab}
						onClick={() => switchTab(tab)}
						className="relative z-10 flex-1 rounded-xl py-2.5 text-[13px] font-medium transition-colors"
						style={{ color: activeTab === tab ? 'var(--background)' : 'var(--text-secondary)' }}
					>
						{activeTab === tab && (
							<motion.div
								layoutId="tab-pill"
								className="gradient-gold absolute inset-0 rounded-xl"
								transition={{ type: 'spring' as const, stiffness: 500, damping: 35 }}
							/>
						)}
						<span className="relative z-10">
							{tab === 'logger' ? t('log.tabLogger') : t('log.tabHistory')}
						</span>
						{tab === 'history' && recentLogs.length > 0 && (
							<motion.span
								className="relative z-10 ms-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums"
								style={{
									background:
										activeTab === tab
											? 'color-mix(in srgb, var(--background) 19%, transparent)'
											: 'color-mix(in srgb, var(--gold) 12%, transparent)',
									color: activeTab === tab ? 'var(--background)' : 'var(--gold)',
								}}
								animate={{ scale: [1, 1.2, 1] }}
								transition={{ duration: 0.3 }}
								key={recentLogs.length}
							>
								{recentLogs.length}
							</motion.span>
						)}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div className="relative overflow-hidden flex-1">
				<AnimatePresence mode="wait" custom={tabDir}>
					{activeTab === 'logger' ? (
						<motion.div
							key="logger"
							custom={tabDir}
							variants={{
								enter: (d: number) => ({ x: d * 40, opacity: 0 }),
								center: { x: 0, opacity: 1 },
								exit: (d: number) => ({ x: d * -40, opacity: 0 }),
							}}
							initial="enter"
							animate="center"
							exit="exit"
							transition={spring}
						>
							<LoggerTab
								quantities={quantities}
								onChange={handleChange}
								total={total}
								onLog={handleLog}
							/>
						</motion.div>
					) : (
						<motion.div
							key="historique"
							custom={tabDir}
							variants={{
								enter: (d: number) => ({ x: d * 40, opacity: 0 }),
								center: { x: 0, opacity: 1 },
								exit: (d: number) => ({ x: d * -40, opacity: 0 }),
							}}
							initial="enter"
							animate="center"
							exit="exit"
							transition={spring}
						>
							<HistoriqueTab logs={recentLogs} onUndo={undoLastLog} />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
