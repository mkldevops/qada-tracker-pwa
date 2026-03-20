import { ChevronDown, Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { PRAYER_CONFIG } from '@/constants/prayers';
import { db } from '@/db/database';
import { exportBackup, importBackup } from '@/db/queries';
import { useNotifications } from '@/hooks/useNotifications';
import { markOnboardingUndone } from '@/lib/onboarding';
import { type SessionOrder, useDebts, usePrayerStore } from '@/stores/prayerStore';
import type { Period, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

type Tab = 'debt' | 'session' | 'app';
type DebtMode = 'years' | 'manual';

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

	const {
		setDebtManual,
		setDebtFromYears,
		setObjective,
		setSessionOrder,
		resetAll,
		loadAll,
		activeObjective,
		sessionOrder,
	} = usePrayerStore();
	const debts = useDebts();

	const [activeTab, setActiveTab] = useState<Tab>('debt');
	const [debtMode, setDebtMode] = useState<DebtMode>('years');

	const [years, setYears] = useState('');
	const [excludedDays, setExcludedDays] = useState('0');
	const [isFemme, setIsFemme] = useState(false);
	const [avgHaydDays, setAvgHaydDays] = useState('6');
	const [manualAmounts, setManualAmounts] = useState<Partial<Record<PrayerName, string>>>({});
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

	const hasManualChanges = Object.values(manualAmounts).some((v) => v !== undefined && v !== '');

	const haydExclusion = isFemme
		? Math.round((parseFloat(years) || 0) * (parseFloat(avgHaydDays) || 6) * 12)
		: 0;
	const totalExcluded = (parseInt(excludedDays, 10) || 0) + haydExclusion;

	const handleSetDebtFromYears = async () => {
		try {
			const y = parseFloat(years);
			if (!Number.isNaN(y) && y > 0) {
				await setDebtFromYears(y, totalExcluded);
				setYears('');
			}
		} catch {
			setDataFeedback({ type: 'error', message: t('settings.importError') });
		}
	};

	const handleApplyAllManual = async () => {
		try {
			for (const [prayer, val] of Object.entries(manualAmounts)) {
				const n = parseInt(val ?? '', 10);
				if (!Number.isNaN(n) && n >= 0 && n <= 999999) {
					await setDebtManual(prayer as PrayerName, n);
				}
			}
			setManualAmounts({});
		} catch {
			setDataFeedback({ type: 'error', message: t('settings.importError') });
		}
	};

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
						onClick={() => setActiveTab(value)}
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
			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -6 }}
					transition={{ duration: 0.15 }}
					className="flex flex-col gap-5"
				>
					{/* ── DETTE tab ── */}
					{activeTab === 'debt' && (
						<>
							{/* Merged debt section */}
							<CollapsibleSection label={t('settings.calculateDebt')} defaultOpen={true}>
								<div
									className="flex flex-col gap-4 rounded-[20px] p-5"
									style={{ background: '#242426', border: '1px solid #3A3A3C' }}
								>
									{/* Mode switcher */}
									<div className="flex gap-2">
										{(['years', 'manual'] as DebtMode[]).map((mode) => (
											<button
												key={mode}
												type="button"
												onClick={() => setDebtMode(mode)}
												className="flex-1 rounded-[20px] py-2.5 text-[13px] font-medium transition-colors"
												style={
													debtMode === mode
														? { background: '#C9A962', color: '#1A1A1C', fontWeight: 600 }
														: {
																background: '#1A1A1C',
																border: '1px solid #3A3A3C',
																color: '#4A4A4C',
															}
												}
											>
												{mode === 'years' ? t('settings.debtByYears') : t('settings.debtManual')}
											</button>
										))}
									</div>

									<div style={{ height: 1, background: '#2A2A2C' }} />

									{/* By years content */}
									{debtMode === 'years' && (
										<>
											<div className="grid grid-cols-2 gap-3">
												<div className="flex flex-col gap-1.5">
													<label
														htmlFor="input-years"
														className="text-xs font-medium"
														style={{ color: '#6E6E70' }}
													>
														{t('settings.missedYears')}
													</label>
													<input
														id="input-years"
														type="number"
														value={years}
														onChange={(e) => setYears(e.target.value)}
														placeholder={t('settings.yearsPlaceholder')}
														min="0"
														step="0.5"
														style={inputStyle}
													/>
												</div>
												<div className="flex flex-col gap-1.5">
													<label
														htmlFor="input-excluded"
														className="text-xs font-medium"
														style={{ color: '#6E6E70' }}
													>
														{t('settings.excludedDays')}
													</label>
													<input
														id="input-excluded"
														type="number"
														value={excludedDays}
														onChange={(e) => setExcludedDays(e.target.value)}
														placeholder="0"
														min="0"
														style={inputStyle}
													/>
												</div>
											</div>

											<div style={{ height: 1, background: '#2A2A2C' }} />
											<div className="flex items-center justify-between">
												<div className="flex flex-col gap-0.5">
													<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
														{t('settings.female')}
													</span>
													<span className="text-[11px]" style={{ color: '#6E6E70' }}>
														{t('settings.femaleDesc')}
													</span>
												</div>
												<button
													type="button"
													role="switch"
													aria-checked={isFemme}
													aria-label={t('settings.female')}
													onClick={() => setIsFemme((v) => !v)}
													className="relative h-7 w-12 rounded-full transition-colors"
													style={{ background: isFemme ? '#C9A962' : '#3A3A3C' }}
												>
													<span
														className="absolute top-1 h-5 w-5 rounded-full transition-all"
														style={{
															background: '#F5F5F0',
															left: isFemme ? '50%' : '4px',
														}}
													/>
												</button>
											</div>

											{isFemme && (
												<div className="flex flex-col gap-1.5">
													<label
														htmlFor="input-hayd"
														className="text-xs font-medium"
														style={{ color: '#6E6E70' }}
													>
														{t('settings.haydAvg')}
													</label>
													<input
														id="input-hayd"
														type="number"
														value={avgHaydDays}
														onChange={(e) => setAvgHaydDays(e.target.value)}
														placeholder="6"
														min="1"
														max="15"
														style={inputStyle}
													/>
													{parseFloat(years) > 0 && (
														<p className="text-[11px]" style={{ color: '#6E9E6E' }}>
															{t('settings.haydDeducted', {
																deducted: haydExclusion,
																total: totalExcluded,
															})}
														</p>
													)}
												</div>
											)}

											<button
												type="button"
												onClick={handleSetDebtFromYears}
												disabled={!years || parseFloat(years) <= 0}
												className="flex w-full items-center justify-center rounded-3xl py-3 text-[13px] font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30"
												style={{
													background: 'linear-gradient(135deg, #C9A962, #8B7845)',
													color: '#1A1A1C',
												}}
											>
												{t('settings.apply')}
											</button>
										</>
									)}

									{/* Manual content */}
									{debtMode === 'manual' && (
										<>
											<div className="flex flex-col">
												{PRAYER_NAMES.map((prayer, i) => {
													const cfg = PRAYER_CONFIG[prayer];
													return (
														<div key={prayer}>
															{i > 0 && <div style={{ height: 1, background: '#2A2A2C' }} />}
															<div className="flex items-center gap-3 py-3">
																<span
																	className="w-20 font-display text-base font-medium"
																	style={{ color: cfg.hex }}
																>
																	{cfg.labelFr}
																</span>
																<span
																	className="w-12 text-right text-sm"
																	style={{ color: '#6E6E70' }}
																>
																	{debts[prayer]?.remaining ?? 0}
																</span>
																<input
																	type="number"
																	className="flex-1"
																	value={manualAmounts[prayer] ?? ''}
																	onChange={(e) =>
																		setManualAmounts((prev) => ({
																			...prev,
																			[prayer]: e.target.value,
																		}))
																	}
																	placeholder={t('settings.newTotal')}
																	min="0"
																	style={{ ...inputStyle, height: 36, fontSize: 13 }}
																/>
															</div>
														</div>
													);
												})}
											</div>

											<button
												type="button"
												onClick={handleApplyAllManual}
												disabled={!hasManualChanges}
												className="flex w-full items-center justify-center rounded-3xl py-3 text-[13px] font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30"
												style={{
													background: 'linear-gradient(135deg, #C9A962, #8B7845)',
													color: '#1A1A1C',
												}}
											>
												{t('settings.apply')}
											</button>
										</>
									)}
								</div>
							</CollapsibleSection>

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
								</div>
							</CollapsibleSection>

							{/* Version */}
							<div
								className="flex items-center justify-between rounded-[20px] px-5 py-4"
								style={{ background: '#242426', border: '1px solid #3A3A3C' }}
							>
								<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
									{t('settings.version')}
								</span>
								<span className="text-sm" style={{ color: '#6E6E70' }}>
									{__APP_VERSION__}
								</span>
							</div>

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
														setDataFeedback({ type: 'error', message: t('settings.importError') });
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
	);
}
