import { ChevronDown, ChevronRight, Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Changelog } from '@/components/Changelog';
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
import { db } from '@/db/database';
import { exportBackup, importBackup } from '@/db/queries';
import { useNotifications } from '@/hooks/useNotifications';
import { markOnboardingUndone } from '@/lib/onboarding';
import { type SessionOrder, usePrayerStore } from '@/stores/prayerStore';
import type { Period } from '@/types';

type Tab = 'debt' | 'session' | 'app';
const SETTINGS_TAB_ORDER: Tab[] = ['debt', 'session', 'app'];

const settingsSlideVariants = {
	initial: (dir: number) => ({ x: dir * 100 + '%', opacity: 0 }),
	animate: { x: 0, opacity: 1 },
	exit: (dir: number) => ({ x: dir * -100 + '%', opacity: 0 }),
};

const settingsSlideTransition = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const };

function CollapsibleSection({
	label,
	defaultOpen,
	children,
}: {
	label: string;
	defaultOpen: boolean;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="flex flex-col gap-2.5">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center justify-between"
			>
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					{label}
				</p>
				<motion.div
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ type: 'spring', stiffness: 400, damping: 30 }}
				>
					<ChevronDown size={14} style={{ color: '#4A4A4C' }} />
				</motion.div>
			</button>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 400, damping: 30 }}
						style={{ overflow: 'hidden' }}
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export function Settings({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
	const { t, i18n } = useTranslation();
	const { permission, isEnabled, reminderTime, enable, disable, updateTime } = useNotifications(
		t('settings.notificationsBody'),
	);

	const PERIODS: { value: Period; label: string }[] = [
		{ value: 'daily', label: t('common.day_cap') },
		{ value: 'weekly', label: t('common.week_cap') },
		{ value: 'monthly', label: t('common.month_cap') },
	];

	const SESSION_ORDERS: { value: SessionOrder; label: string }[] = [
		{ value: 'chronological', label: t('settings.chronological') },
		{ value: 'highest-debt', label: t('settings.highestDebt') },
	];

	const { setObjective, setSessionOrder, resetAll, loadAll, activeObjective, sessionOrder } =
		usePrayerStore();

	const [activeTab, setActiveTab] = useState<Tab>('debt');
	const settingsDirRef = useRef(0);

	function handleSettingsTabChange(tab: Tab) {
		if (tab === activeTab) return;
		settingsDirRef.current =
			SETTINGS_TAB_ORDER.indexOf(tab) > SETTINGS_TAB_ORDER.indexOf(activeTab) ? 1 : -1;
		setActiveTab(tab);
	}
	const [showChangelog, setShowChangelog] = useState(false);

	const [objPeriod, setObjPeriod] = useState<Period>('daily');
	const [objTarget, setObjTarget] = useState('');
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [dataFeedback, setDataFeedback] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!dataFeedback) return;
		const timeout = setTimeout(() => setDataFeedback(null), 5000);
		return () => clearTimeout(timeout);
	}, [dataFeedback]);

	const handleSetObjective = async () => {
		try {
			const target = parseInt(objTarget, 10);
			if (!Number.isNaN(target) && target > 0) {
				await setObjective(objPeriod, target);
				setObjTarget('');
			}
		} catch {
			setDataFeedback({ type: 'error', message: t('settings.importError') });
		}
	};

	const handleExport = async () => {
		try {
			await exportBackup(db);
			setDataFeedback({ type: 'success', message: t('settings.exportSuccess') });
		} catch {
			setDataFeedback({ type: 'error', message: t('settings.exportError') });
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setPendingFile(file);
		}
		e.target.value = '';
	};

	const handleImportConfirm = async () => {
		if (!pendingFile) return;
		try {
			await importBackup(db, pendingFile, loadAll);
			setDataFeedback({ type: 'success', message: t('settings.importSuccess') });
		} catch {
			setDataFeedback({ type: 'error', message: t('settings.importError') });
		} finally {
			setPendingFile(null);
		}
	};

	const inputStyle = {
		background: '#1A1A1C',
		border: '1px solid #3A3A3C',
		borderRadius: 12,
		color: '#F5F5F0',
		padding: '0 14px',
		height: 44,
		fontSize: 15,
		fontWeight: 500,
		width: '100%',
		outline: 'none',
	} as const;

	const TABS: { value: Tab; label: string }[] = [
		{ value: 'debt', label: t('settings.tabDebt') },
		{ value: 'session', label: t('settings.tabSession') },
		{ value: 'app', label: t('settings.tabApp') },
	];

	return (
		<>
			<AnimatePresence>
				{showChangelog && <Changelog onClose={() => setShowChangelog(false)} />}
			</AnimatePresence>
			<div className="flex flex-col gap-5 px-7 pb-4 pt-1">
				<h1 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
					{t('settings.title')}
				</h1>

				{/* Tab bar */}
				<div
					className="flex gap-1 rounded-[20px] p-1"
					style={{ background: '#1A1A1C', border: '1px solid #3A3A3C' }}
				>
					{TABS.map(({ value, label }) => (
						<button
							key={value}
							type="button"
							onClick={() => handleSettingsTabChange(value)}
							className="flex-1 rounded-[16px] py-2.5 text-[11px] font-semibold tracking-[1.5px] transition-colors"
							style={
								activeTab === value
									? { background: '#C9A962', color: '#1A1A1C' }
									: { color: '#4A4A4C' }
							}
						>
							{label}
						</button>
					))}
				</div>

				{/* Tab content */}
				<AnimatePresence mode="wait" initial={false} custom={settingsDirRef.current}>
					<motion.div
						key={activeTab}
						custom={settingsDirRef.current}
						variants={settingsSlideVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={settingsSlideTransition}
						className="flex flex-col gap-5 overflow-hidden"
					>
						{/* ── DETTE tab ── */}
						{activeTab === 'debt' && (
							<>
								{/* Objective */}
								<CollapsibleSection label={t('settings.objective')} defaultOpen={true}>
									<div
										className="flex flex-col gap-4 rounded-[20px] p-5"
										style={{ background: '#242426', border: '1px solid #3A3A3C' }}
									>
										{activeObjective && (
											<p className="text-xs" style={{ color: '#6E6E70' }}>
												{t('settings.currentObjective', {
													target: activeObjective.target,
													period: t(
														`common.${activeObjective.period === 'daily' ? 'day' : activeObjective.period === 'weekly' ? 'week' : 'month'}`,
													),
												})}
											</p>
										)}
										<div className="flex gap-2">
											{PERIODS.map(({ value, label }) => (
												<button
													type="button"
													key={value}
													onClick={() => setObjPeriod(value)}
													className="flex-1 rounded-[20px] py-2.5 text-[13px] font-medium transition-colors"
													style={
														objPeriod === value
															? { background: '#C9A962', color: '#1A1A1C', fontWeight: 600 }
															: {
																	background: '#1A1A1C',
																	border: '1px solid #3A3A3C',
																	color: '#4A4A4C',
																}
													}
												>
													{label}
												</button>
											))}
										</div>
										<div className="flex gap-2">
											<input
												type="number"
												value={objTarget}
												onChange={(e) => setObjTarget(e.target.value)}
												placeholder={t('settings.targetPlaceholder')}
												min="1"
												style={{ ...inputStyle, flex: 1 }}
											/>
											<button
												type="button"
												onClick={handleSetObjective}
												disabled={!objTarget}
												className="rounded-[22px] px-6 text-[13px] font-bold transition-opacity disabled:opacity-30"
												style={{
													background: 'linear-gradient(135deg, #C9A962, #8B7845)',
													color: '#1A1A1C',
												}}
											>
												{t('settings.apply')}
											</button>
										</div>
									</div>
								</CollapsibleSection>

								{onRestartOnboarding && (
									<button
										type="button"
										onClick={onRestartOnboarding}
										className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
										style={{ background: '#242426', border: '1px solid #3A3A3C' }}
									>
										<RotateCcw size={16} style={{ color: '#C9A962' }} />
										<span
											className="text-xs font-semibold tracking-[1px]"
											style={{ color: '#C9A962' }}
										>
											{t('settings.restartOnboarding')}
										</span>
									</button>
								)}
							</>
						)}

						{/* ── SESSION tab ── */}
						{activeTab === 'session' && (
							<>
								<CollapsibleSection label={t('settings.session')} defaultOpen={true}>
									<div
										className="flex flex-col gap-4 rounded-[20px] p-5"
										style={{ background: '#242426', border: '1px solid #3A3A3C' }}
									>
										<div className="flex flex-col gap-1">
											<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
												{t('settings.prayerOrder')}
											</span>
											<span className="text-[11px]" style={{ color: '#6E6E70' }}>
												{t('settings.prayerOrderDesc')}
											</span>
										</div>
										<div className="flex gap-2">
											{SESSION_ORDERS.map(({ value, label }) => (
												<button
													type="button"
													key={value}
													onClick={() => setSessionOrder(value)}
													className="flex-1 rounded-[20px] py-2.5 text-[13px] font-medium transition-colors"
													style={
														sessionOrder === value
															? { background: '#C9A962', color: '#1A1A1C', fontWeight: 600 }
															: {
																	background: '#1A1A1C',
																	border: '1px solid #3A3A3C',
																	color: '#4A4A4C',
																}
													}
												>
													{label}
												</button>
											))}
										</div>
									</div>
								</CollapsibleSection>

								<CollapsibleSection label={t('settings.notifications')} defaultOpen={true}>
									<div
										className="flex flex-col gap-4 rounded-[20px] p-5"
										style={{ background: '#242426', border: '1px solid #3A3A3C' }}
									>
										{/* Toggle row */}
										<div className="flex items-center justify-between">
											<div className="flex flex-col gap-0.5">
												<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
													{t('settings.notificationsDesc')}
												</span>
											</div>
											<button
												type="button"
												role="switch"
												aria-checked={isEnabled}
												aria-label={t('settings.notifications')}
												onClick={() => (isEnabled ? disable() : enable(reminderTime))}
												className="relative h-7 w-12 rounded-full transition-colors"
												style={{ background: isEnabled ? '#C9A962' : '#3A3A3C' }}
											>
												<span
													className="absolute top-1 h-5 w-5 rounded-full transition-all"
													style={{
														background: '#F5F5F0',
														left: isEnabled ? '50%' : '4px',
													}}
												/>
											</button>
										</div>

										{isEnabled && permission === 'granted' && (
											<div className="flex flex-col gap-1.5">
												<label
													htmlFor="input-reminder-time"
													className="text-xs font-medium"
													style={{ color: '#6E6E70' }}
												>
													{t('settings.notificationsTime')}
												</label>
												<input
													id="input-reminder-time"
													type="time"
													value={reminderTime}
													onChange={(e) => updateTime(e.target.value)}
													style={inputStyle}
												/>
											</div>
										)}

										{permission === 'denied' && (
											<p className="text-[11px]" style={{ color: '#D45F5F' }}>
												{t('settings.notificationsPermissionDenied')}
											</p>
										)}
									</div>
								</CollapsibleSection>
							</>
						)}

						{/* ── APP tab ── */}
						{activeTab === 'app' && (
							<>
								{/* Données */}
								<CollapsibleSection label={t('settings.data')} defaultOpen={true}>
									<div
										className="flex flex-col gap-3 rounded-[20px] p-5"
										style={{ background: '#242426', border: '1px solid #3A3A3C' }}
									>
										{dataFeedback && (
											<p
												className="text-[11px] font-medium"
												style={{
													color: dataFeedback.type === 'success' ? '#6E9E6E' : '#D45F5F',
												}}
											>
												{dataFeedback.message}
											</p>
										)}
										<button
											type="button"
											onClick={handleExport}
											className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
											style={{ background: '#1A1A1C', border: '1px solid #3A3A3C' }}
										>
											<Download size={16} style={{ color: '#C9A962' }} />
											<span
												className="text-xs font-semibold tracking-[1px]"
												style={{ color: '#C9A962' }}
											>
												{t('settings.exportBackup')}
											</span>
										</button>

										<input
											ref={fileInputRef}
											type="file"
											accept=".json"
											className="hidden"
											onChange={handleFileSelect}
										/>

										<AlertDialog
											open={pendingFile !== null}
											onOpenChange={(open) => {
												if (!open) setPendingFile(null);
											}}
										>
											<AlertDialogTrigger asChild>
												<button
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
													style={{ background: '#1A1A1C', border: '1px solid #3A3A3C' }}
												>
													<Upload size={16} style={{ color: '#C9A962' }} />
													<span
														className="text-xs font-semibold tracking-[1px]"
														style={{ color: '#C9A962' }}
													>
														{t('settings.importBackup')}
													</span>
												</button>
											</AlertDialogTrigger>
											<AlertDialogContent
												style={{ background: '#242426', border: '1px solid #3A3A3C' }}
											>
												<AlertDialogHeader>
													<AlertDialogTitle style={{ color: '#F5F5F0' }}>
														{t('settings.importDialogTitle')}
													</AlertDialogTitle>
													<AlertDialogDescription style={{ color: '#6E6E70' }}>
														{t('settings.importDialogDesc', { filename: pendingFile?.name ?? '' })}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel
														style={{ background: '#2A2A2C', color: '#F5F5F0', border: 'none' }}
													>
														{t('settings.importDialogCancel')}
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={handleImportConfirm}
														style={{ background: '#C9A962', color: '#1A1A1C' }}
													>
														{t('settings.importDialogConfirm')}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</CollapsibleSection>

								{/* Configuration */}
								<CollapsibleSection label={t('settings.configuration')} defaultOpen={true}>
									<div className="flex flex-col gap-3">
										{/* Language */}
										<div
											className="flex gap-2 rounded-[20px] p-3"
											style={{ background: '#242426', border: '1px solid #3A3A3C' }}
										>
											{(['fr', 'en'] as const).map((lang) => (
												<button
													key={lang}
													type="button"
													onClick={() => i18n.changeLanguage(lang)}
													className="flex-1 rounded-[16px] py-2.5 text-[13px] font-semibold transition-colors"
													style={
														i18n.resolvedLanguage === lang
															? { background: '#C9A962', color: '#1A1A1C' }
															: {
																	background: '#1A1A1C',
																	border: '1px solid #3A3A3C',
																	color: '#4A4A4C',
																}
													}
												>
													{lang === 'fr' ? 'Français' : 'English'}
												</button>
											))}
										</div>
									</div>
								</CollapsibleSection>

								{/* Version */}
								<button
									type="button"
									onClick={() => setShowChangelog(true)}
									className="flex w-full items-center justify-between rounded-[20px] px-5 py-4"
									style={{ background: '#242426', border: '1px solid #3A3A3C' }}
								>
									<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
										{t('settings.version')}
									</span>
									<div className="flex items-center gap-2">
										<span className="text-sm" style={{ color: '#6E6E70' }}>
											{__APP_VERSION__}
										</span>
										<ChevronRight size={14} style={{ color: '#4A4A4C' }} />
									</div>
								</button>

								{/* Zone Danger */}
								<CollapsibleSection label={t('settings.dangerZone')} defaultOpen={true}>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<button
												type="button"
												className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
												style={{ background: '#2A1515', border: '1px solid #D45F5F33' }}
											>
												<Trash2 size={18} style={{ color: '#D45F5F' }} />
												<span
													className="text-xs font-semibold tracking-[1px]"
													style={{ color: '#D45F5F' }}
												>
													{t('settings.resetAll')}
												</span>
											</button>
										</AlertDialogTrigger>
										<AlertDialogContent
											style={{ background: '#242426', border: '1px solid #3A3A3C' }}
										>
											<AlertDialogHeader>
												<AlertDialogTitle style={{ color: '#F5F5F0' }}>
													{t('settings.resetDialogTitle')}
												</AlertDialogTitle>
												<AlertDialogDescription style={{ color: '#6E6E70' }}>
													{t('settings.resetDialogDesc')}
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel
													style={{ background: '#2A2A2C', color: '#F5F5F0', border: 'none' }}
												>
													{t('settings.resetDialogCancel')}
												</AlertDialogCancel>
												<AlertDialogAction
													onClick={async () => {
														try {
															await resetAll();
															markOnboardingUndone();
															onRestartOnboarding?.();
														} catch {
															setDataFeedback({
																type: 'error',
																message: t('settings.importError'),
															});
														}
													}}
													style={{ background: '#D45F5F', color: '#F5F5F0' }}
												>
													{t('settings.resetDialogConfirm')}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</CollapsibleSection>
							</>
						)}
					</motion.div>
				</AnimatePresence>
			</div>
		</>
	);
}
