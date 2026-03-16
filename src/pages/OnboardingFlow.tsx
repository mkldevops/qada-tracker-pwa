import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRAYER_CONFIG } from '@/constants/prayers';
import { formatDays } from '@/lib/formatDays';
import { usePrayerStore, useTotalRemaining } from '@/stores/prayerStore';
import type { Period, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

type Step = 'welcome' | 'debt' | 'objective' | 'summary';
type DebtMode = 'years' | 'manual';
type DebtData =
	| { mode: 'years'; years: number; excluded: number }
	| { mode: 'manual'; amounts: Record<PrayerName, number> };

const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };
const springSnappy = { type: 'spring' as const, stiffness: 500, damping: 28 };

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

function StepIndicator({ current, total }: { current: number; total: number }) {
	return (
		<div className="flex items-center gap-1.5">
			{Array.from({ length: total }, (_, i) => i + 1).map((n) => (
				<motion.div
					key={n}
					className="rounded-full"
					animate={{
						width: n === current ? 20 : 6,
						background: n <= current ? '#C9A962' : '#3A3A3C',
					}}
					transition={spring}
					style={{ height: 6 }}
				/>
			))}
		</div>
	);
}

function ErrorBanner({ message }: { message: string }) {
	return (
		<motion.div
			className="rounded-2xl px-4 py-3 text-sm"
			style={{ background: '#2A1515', border: '1px solid #D45F5F40', color: '#D45F5F' }}
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={spring}
		>
			{message}
		</motion.div>
	);
}

function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
	const { t } = useTranslation();

	return (
		<motion.div
			key="welcome"
			className="flex flex-1 flex-col items-center justify-center px-7 gap-8 text-center"
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, x: -60 }}
			transition={spring}
		>
			<motion.div
				className="flex flex-col items-center gap-4"
				initial={{ opacity: 0, scale: 0.85 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.05, ...springSnappy }}
			>
				<motion.div
					className="flex h-24 w-24 items-center justify-center rounded-3xl"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)' }}
					animate={{ boxShadow: ['0 0 0px #C9A96240', '0 0 30px #C9A96240', '0 0 0px #C9A96240'] }}
					transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
				>
					<p
						className="font-display text-4xl font-normal leading-none"
						style={{ color: '#1A1A1C' }}
					>
						قضاء
					</p>
				</motion.div>

				<motion.div
					className="flex flex-col gap-2"
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, ...spring }}
				>
					<h1 className="font-display text-4xl font-normal" style={{ color: '#F5F5F0' }}>
						{t('onboarding.welcome')}
					</h1>
					<p className="text-sm leading-relaxed max-w-[260px]" style={{ color: '#6E6E70' }}>
						{t('onboarding.welcomeSubtitle')}
					</p>
				</motion.div>
			</motion.div>

			<motion.div
				className="w-full flex flex-col gap-3"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.18, ...spring }}
			>
				<div
					className="rounded-[20px] p-5 flex flex-col gap-4 text-left"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					{[
						{ n: '1', label: t('onboarding.step1Label'), sub: t('onboarding.step1Sub') },
						{ n: '2', label: t('onboarding.step2Label'), sub: t('onboarding.step2Sub') },
					].map(({ n, label, sub }, i) => (
						<motion.div
							key={n}
							className="flex items-center gap-3"
							initial={{ opacity: 0, x: -12 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.22 + i * 0.07, ...spring }}
						>
							<div
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
								style={{
									background: 'linear-gradient(135deg, #C9A962, #8B7845)',
									color: '#1A1A1C',
								}}
							>
								{n}
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>
									{label}
								</span>
								<span className="text-xs" style={{ color: '#6E6E70' }}>
									{sub}
								</span>
							</div>
						</motion.div>
					))}
				</div>

				<motion.button
					type="button"
					onClick={onNext}
					className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px]"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.38, ...spring }}
					whileTap={{ scale: 0.95 }}
					whileHover={{ scale: 1.02 }}
				>
					{t('onboarding.start')}
				</motion.button>
				<motion.button
					type="button"
					onClick={onSkip}
					className="text-sm py-2"
					style={{ color: '#4A4A4C' }}
					whileTap={{ scale: 0.95 }}
				>
					{t('onboarding.skipConfig')}
				</motion.button>
			</motion.div>
		</motion.div>
	);
}

function DebtStep({
	onNext,
	onSkip,
	saving,
	saveError,
}: {
	onNext: (data: DebtData) => void;
	onSkip: () => void;
	saving: boolean;
	saveError: string | null;
}) {
	const { t } = useTranslation();
	const [debtMode, setDebtMode] = useState<DebtMode>('years');

	// Years mode
	const [years, setYears] = useState('');
	const [isFemme, setIsFemme] = useState(false);
	const [avgHaydDays, setAvgHaydDays] = useState('6');
	const [excludedDays, setExcludedDays] = useState('0');

	// Manual mode
	const [manualAmounts, setManualAmounts] = useState<Partial<Record<PrayerName, string>>>({});

	// Years computations
	const parsedYears = parseFloat(years) || 0;
	const clampedYears = Math.min(100, Math.max(0, parsedYears));
	const haydExclusion = isFemme
		? Math.round(clampedYears * (Math.min(15, Math.max(1, parseFloat(avgHaydDays) || 6)) * 12))
		: 0;
	const totalExcluded = Math.max(0, parseInt(excludedDays, 10) || 0) + haydExclusion;
	const effectiveDays = Math.max(0, Math.round(clampedYears * 365.25) - totalExcluded);
	const totalPreview = effectiveDays * PRAYER_NAMES.length;

	// Manual computations
	const manualTotals = Object.fromEntries(
		PRAYER_NAMES.map((p) => [p, Math.max(0, parseInt(manualAmounts[p] ?? '0', 10) || 0)]),
	) as Record<PrayerName, number>;
	const manualTotal = Object.values(manualTotals).reduce((s, v) => s + v, 0);

	const canProceed =
		debtMode === 'years' ? clampedYears >= 0.5 && clampedYears <= 100 : manualTotal > 0;

	function handleSubmit() {
		if (debtMode === 'years') {
			onNext({ mode: 'years', years: clampedYears, excluded: totalExcluded });
		} else {
			onNext({ mode: 'manual', amounts: manualTotals });
		}
	}

	return (
		<motion.div
			key="debt"
			className="flex flex-1 flex-col px-7 pt-10 pb-8 gap-5 overflow-y-auto"
			initial={{ opacity: 0, x: 60 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -60 }}
			transition={spring}
		>
			<div className="flex flex-col gap-3">
				<StepIndicator current={1} total={2} />
				<h2 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
					{t('onboarding.debtTitle')}
				</h2>
			</div>

			{/* Mode switcher */}
			<div
				className="flex gap-1.5 rounded-2xl p-1"
				style={{ background: '#242426', border: '1px solid #3A3A3C' }}
			>
				{(['years', 'manual'] as const).map((m) => {
					const active = debtMode === m;
					return (
						<motion.button
							key={m}
							type="button"
							onClick={() => setDebtMode(m)}
							className="flex-1 rounded-xl py-2 text-[13px] font-semibold"
							animate={{
								background: active ? '#C9A962' : 'transparent',
								color: active ? '#1A1A1C' : '#6E6E70',
							}}
							transition={springSnappy}
							whileTap={{ scale: 0.96 }}
						>
							{m === 'years' ? t('onboarding.byYears') : t('onboarding.manual')}
						</motion.button>
					);
				})}
			</div>

			<AnimatePresence mode="wait">
				{debtMode === 'years' && (
					<motion.div
						key="years"
						className="flex flex-col gap-4 rounded-[20px] p-5"
						style={{ background: '#242426', border: '1px solid #3A3A3C' }}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={spring}
					>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="ob-years"
									className="text-sm font-medium"
									style={{ color: '#F5F5F0' }}
								>
									{t('onboarding.missedYears')}
								</label>
								<input
									id="ob-years"
									type="number"
									value={years}
									onChange={(e) => setYears(e.target.value)}
									placeholder={t('onboarding.yearsPlaceholder')}
									min="0.5"
									max="100"
									step="0.5"
									style={inputStyle}
								/>
							</div>
							<div style={{ height: 1, background: '#2A2A2C' }} />
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="ob-excluded"
									className="text-[11px] font-medium"
									style={{ color: '#9A9A9C' }}
								>
									{t('onboarding.excludedDays')}
								</label>
								<input
									id="ob-excluded"
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
									{t('onboarding.female')}
								</span>
								<span className="text-[11px]" style={{ color: '#6E6E70' }}>
									{t('onboarding.femaleDesc')}
								</span>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={isFemme}
								aria-label={t('onboarding.femaleDesc')}
								onClick={() => setIsFemme((v) => !v)}
								className="relative h-7 w-12 rounded-full transition-colors"
								style={{ background: isFemme ? '#C9A962' : '#3A3A3C' }}
							>
								<motion.span
									className="absolute top-1 h-5 w-5 rounded-full"
									style={{ background: '#F5F5F0' }}
									animate={{ left: isFemme ? '50%' : '4px' }}
									transition={springSnappy}
								/>
							</button>
						</div>

						<AnimatePresence>
							{isFemme && (
								<motion.div
									className="flex flex-col gap-1.5"
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={spring}
								>
									<label
										htmlFor="ob-hayd"
										className="text-xs font-medium"
										style={{ color: '#9A9A9C' }}
									>
										{t('onboarding.haydAvg')}
									</label>
									<input
										id="ob-hayd"
										type="number"
										value={avgHaydDays}
										onChange={(e) =>
											setAvgHaydDays(
												String(Math.min(15, Math.max(1, parseInt(e.target.value, 10) || 6))),
											)
										}
										placeholder="6"
										min="1"
										max="15"
										style={inputStyle}
									/>
									{clampedYears > 0 && (
										<motion.p
											className="text-[11px]"
											style={{ color: '#6E9E6E' }}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={spring}
										>
											{t('onboarding.haydDeducted', {
												deducted: haydExclusion,
												total: totalExcluded,
											})}
										</motion.p>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}

				{debtMode === 'manual' && (
					<motion.div
						key="manual"
						className="rounded-[20px] overflow-hidden"
						style={{ background: '#242426', border: '1px solid #3A3A3C' }}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={spring}
					>
						{PRAYER_NAMES.map((prayer, i) => {
							const cfg = PRAYER_CONFIG[prayer];
							return (
								<motion.div
									key={prayer}
									initial={{ opacity: 0, x: 12 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: i * 0.05, ...spring }}
								>
									{i > 0 && <div style={{ height: 1, background: '#2A2A2C' }} />}
									<div className="flex items-center gap-3 px-5 py-3">
										<div className="flex flex-col gap-0.5 w-20">
											<span
												className="font-display text-base font-medium"
												style={{ color: cfg.hex }}
											>
												{cfg.labelFr}
											</span>
											<span className="text-[10px]" style={{ color: '#4A4A4C' }}>
												{cfg.labelAr}
											</span>
										</div>
										<input
											type="number"
											className="flex-1"
											value={manualAmounts[prayer] ?? ''}
											onChange={(e) =>
												setManualAmounts((prev) => ({ ...prev, [prayer]: e.target.value }))
											}
											placeholder={t('onboarding.manualPlaceholder')}
											min="0"
											style={{ ...inputStyle, height: 36, fontSize: 13 }}
										/>
									</div>
								</motion.div>
							);
						})}
						<AnimatePresence>
							{manualTotal > 0 && (
								<motion.div
									className="flex items-center justify-between px-5 py-3"
									style={{ background: '#1A2820', borderTop: '1px solid #6E9E6E30' }}
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={spring}
								>
									<span className="text-xs" style={{ color: '#6E9E6E' }}>
										{t('onboarding.total')}
									</span>
									<span
										className="text-base font-semibold tabular-nums"
										style={{ color: '#F5F5F0' }}
									>
										{manualTotal.toLocaleString()}
									</span>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Years mode preview */}
			<AnimatePresence>
				{debtMode === 'years' && canProceed && (
					<motion.div
						className="rounded-[20px] p-5 flex flex-col gap-3"
						style={{ background: '#1A2820', border: '1px solid #6E9E6E40' }}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						transition={spring}
					>
						<p className="text-[11px] font-medium tracking-[2px]" style={{ color: '#6E9E6E' }}>
							{t('onboarding.preview')}
						</p>
						<div className="flex justify-between items-center">
							<span className="text-sm" style={{ color: '#6E6E70' }}>
								{t('onboarding.estimatedTotal')}
							</span>
							<motion.span
								key={totalPreview}
								className="text-xl font-semibold tabular-nums"
								style={{ color: '#F5F5F0' }}
								initial={{ opacity: 0, y: -6 }}
								animate={{ opacity: 1, y: 0 }}
								transition={spring}
							>
								{totalPreview.toLocaleString()}
							</motion.span>
						</div>
						<div style={{ height: 1, background: '#2A3A30' }} />
						{PRAYER_NAMES.map((p) => {
							const cfg = PRAYER_CONFIG[p];
							return (
								<div key={p} className="flex justify-between items-center">
									<span className="text-sm font-medium" style={{ color: cfg.hex }}>
										{cfg.labelFr}
									</span>
									<span className="text-sm tabular-nums" style={{ color: '#6E6E70' }}>
										{effectiveDays.toLocaleString()}
									</span>
								</div>
							);
						})}
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>{saveError && <ErrorBanner message={saveError} />}</AnimatePresence>

			<div className="mt-auto flex flex-col gap-3">
				<motion.button
					type="button"
					onClick={handleSubmit}
					disabled={!canProceed || saving}
					className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30 relative overflow-hidden"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
					whileTap={{ scale: 0.95 }}
					whileHover={{ scale: 1.02 }}
				>
					{saving ? (
						<motion.span
							className="flex items-center justify-center gap-2"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							<motion.span
								animate={{ rotate: 360 }}
								transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
								className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent"
							/>
						</motion.span>
					) : (
						t('onboarding.next')
					)}
				</motion.button>
				<motion.button
					type="button"
					onClick={onSkip}
					className="text-sm py-2"
					style={{ color: '#4A4A4C' }}
					whileTap={{ scale: 0.95 }}
				>
					{t('onboarding.skipStep')}
				</motion.button>
			</div>
		</motion.div>
	);
}

function ObjectiveStep({
	onNext,
	saving,
	saveError,
}: {
	onNext: (period: Period, target: number) => void;
	saving: boolean;
	saveError: string | null;
}) {
	const { t } = useTranslation();
	const totalRemaining = useTotalRemaining();
	const [objPeriod, setObjPeriod] = useState<Period>('daily');
	const [objTarget, setObjTarget] = useState('');

	const suggestion = (() => {
		if (totalRemaining === 0) return null;
		const raw =
			objPeriod === 'daily'
				? totalRemaining / 365
				: objPeriod === 'weekly'
					? totalRemaining / 52
					: totalRemaining / 12;
		return Math.max(5, Math.round(raw / 5) * 5);
	})();

	const parsedTarget = parseInt(objTarget, 10);
	const effectiveTarget = !Number.isNaN(parsedTarget) && parsedTarget > 0 ? parsedTarget : null;

	const estimation = (() => {
		if (!effectiveTarget || totalRemaining === 0) return null;
		const totalPeriods = Math.ceil(totalRemaining / effectiveTarget);
		const totalDays =
			objPeriod === 'daily'
				? totalPeriods
				: objPeriod === 'weekly'
					? totalPeriods * 7
					: totalPeriods * 30;
		return formatDays(totalDays);
	})();

	return (
		<motion.div
			key="objective"
			className="flex flex-1 flex-col px-7 pt-10 pb-8 gap-6"
			initial={{ opacity: 0, x: 60 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -60 }}
			transition={spring}
		>
			<div className="flex flex-col gap-3">
				<StepIndicator current={2} total={2} />
				<div className="flex flex-col gap-1">
					<h2 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
						{t('onboarding.objectiveTitle')}
					</h2>
					<p className="text-sm" style={{ color: '#6E6E70' }}>
						{t('onboarding.objectiveSubtitle')}
					</p>
				</div>
			</div>

			<div
				className="flex flex-col gap-4 rounded-[20px] p-5"
				style={{ background: '#242426', border: '1px solid #3A3A3C' }}
			>
				<div
					className="flex gap-1.5 rounded-2xl p-1"
					style={{ background: '#1A1A1C', border: '1px solid #3A3A3C' }}
				>
					{[
						{ value: 'daily' as Period, label: t('common.day_cap') },
						{ value: 'weekly' as Period, label: t('common.week_cap') },
						{ value: 'monthly' as Period, label: t('common.month_cap') },
					].map(({ value, label }) => {
						const active = objPeriod === value;
						return (
							<motion.button
								type="button"
								key={value}
								onClick={() => setObjPeriod(value)}
								className="flex-1 rounded-xl py-2 text-[13px] font-semibold"
								animate={{
									background: active ? '#C9A962' : 'transparent',
									color: active ? '#1A1A1C' : '#6E6E70',
								}}
								transition={springSnappy}
								whileTap={{ scale: 0.96 }}
							>
								{label}
							</motion.button>
						);
					})}
				</div>

				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<label htmlFor="ob-target" className="text-xs font-medium" style={{ color: '#6E6E70' }}>
							{t('onboarding.targetPer', {
								period: t(
									`common.${objPeriod === 'daily' ? 'day' : objPeriod === 'weekly' ? 'week' : 'month'}`,
								),
							})}
						</label>
						<AnimatePresence>
							{suggestion && (
								<motion.button
									type="button"
									onClick={() => setObjTarget(String(suggestion))}
									className="text-[11px] font-medium"
									style={{ color: '#C9A962' }}
									initial={{ opacity: 0, x: 8 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 8 }}
									transition={spring}
								>
									{t('onboarding.suggestion', { value: suggestion })}
								</motion.button>
							)}
						</AnimatePresence>
					</div>
					<input
						id="ob-target"
						type="number"
						value={objTarget}
						onChange={(e) => setObjTarget(e.target.value)}
						placeholder={
							suggestion
								? t('onboarding.inputPlaceholder', { value: suggestion })
								: t('onboarding.targetPlaceholder')
						}
						min="1"
						style={inputStyle}
					/>
				</div>

				<AnimatePresence>
					{estimation && (
						<motion.div
							className="flex items-center justify-between rounded-xl px-4 py-3"
							style={{ background: '#1A1A1C', border: '1px solid #C9A96230' }}
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={spring}
						>
							<span className="text-xs" style={{ color: '#6E6E70' }}>
								{t('onboarding.estimationLabel')}
							</span>
							<motion.span
								key={estimation}
								className="text-sm font-semibold tabular-nums"
								style={{ color: '#C9A962' }}
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								transition={spring}
							>
								{t('onboarding.estimationValue', { value: estimation })}
							</motion.span>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence>{saveError && <ErrorBanner message={saveError} />}</AnimatePresence>

			<div className="mt-auto flex flex-col gap-3">
				<motion.button
					type="button"
					onClick={() => effectiveTarget && onNext(objPeriod, effectiveTarget)}
					disabled={!effectiveTarget || saving}
					className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
					whileTap={{ scale: 0.95 }}
					whileHover={{ scale: 1.02 }}
				>
					{saving ? (
						<motion.span className="flex items-center justify-center gap-2">
							<motion.span
								animate={{ rotate: 360 }}
								transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
								className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent"
							/>
						</motion.span>
					) : (
						t('onboarding.finish')
					)}
				</motion.button>
				<motion.button
					type="button"
					onClick={() => onNext(objPeriod, suggestion ?? 10)}
					className="text-sm py-2"
					style={{ color: '#4A4A4C' }}
					whileTap={{ scale: 0.95 }}
				>
					{t('onboarding.skipStep')}
				</motion.button>
			</div>
		</motion.div>
	);
}

function SummaryStep({ onComplete }: { onComplete: () => void }) {
	const { t } = useTranslation();
	const totalRemaining = useTotalRemaining();
	const activeObjective = usePrayerStore((s) => s.activeObjective);

	return (
		<motion.div
			key="summary"
			className="flex flex-1 flex-col items-center justify-center px-7 gap-7 text-center"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.35 }}
		>
			<div className="relative flex items-center justify-center">
				<motion.div
					initial={{ scale: 0, rotate: -30 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
				>
					<motion.div
						animate={{ scale: [1, 1.08, 1] }}
						transition={{ delay: 0.5, duration: 0.6, ease: 'easeInOut' }}
					>
						<CheckCircle2 size={72} style={{ color: '#C9A962' }} />
					</motion.div>
				</motion.div>
				{[
					{ delay: 0.4, duration: 1.2, scale: 2.5, color: '#C9A96240' },
					{ delay: 0.6, duration: 1.5, scale: 3.5, color: '#C9A96230' },
					{ delay: 0.8, duration: 1.8, scale: 4.5, color: '#C9A96218' },
				].map(({ delay, duration, scale, color }) => (
					<motion.div
						key={delay}
						className="absolute w-24 h-24 rounded-full"
						style={{ border: `2px solid ${color}` }}
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale, opacity: 0 }}
						transition={{ delay, duration, ease: 'easeOut' }}
					/>
				))}
			</div>

			<motion.div
				className="flex flex-col items-center gap-2"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.25, ...spring }}
			>
				<h2 className="font-display text-4xl font-normal" style={{ color: '#F5F5F0' }}>
					{t('onboarding.summaryTitle')}
				</h2>
				<p className="text-sm" style={{ color: '#6E6E70' }}>
					{t('onboarding.summarySubtitle')}
				</p>
			</motion.div>

			<motion.div
				className="w-full rounded-[20px] overflow-hidden"
				style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.35, ...spring }}
			>
				<div className="flex items-center justify-between px-5 py-4">
					<span className="text-sm" style={{ color: '#6E6E70' }}>
						{t('onboarding.prayersToCatch')}
					</span>
					<span className="text-xl font-semibold tabular-nums" style={{ color: '#C9A962' }}>
						{totalRemaining.toLocaleString()}
					</span>
				</div>
				<div style={{ height: 1, background: '#2A2A2C' }} />
				<div className="flex items-center justify-between px-5 py-4">
					<span className="text-sm" style={{ color: '#6E6E70' }}>
						{t('onboarding.summaryObjective')}
					</span>
					<span className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>
						{activeObjective
							? t('onboarding.summaryObjectivePeriod', {
									target: activeObjective.target,
									period: t(
										`common.${activeObjective.period === 'daily' ? 'day' : activeObjective.period === 'weekly' ? 'week' : 'month'}`,
									),
								})
							: '—'}
					</span>
				</div>
			</motion.div>

			<motion.button
				type="button"
				onClick={onComplete}
				className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px]"
				style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.45, ...spring }}
				whileTap={{ scale: 0.95 }}
				whileHover={{ scale: 1.02 }}
			>
				{t('onboarding.save')}
			</motion.button>
		</motion.div>
	);
}

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
	const { t } = useTranslation();
	const { setDebtFromYears, setDebtManual, setObjective } = usePrayerStore();
	const [step, setStep] = useState<Step>('welcome');
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	async function handleDebtNext(data: DebtData) {
		setSaving(true);
		setSaveError(null);
		try {
			if (data.mode === 'years') {
				await setDebtFromYears(data.years, data.excluded);
			} else {
				for (const prayer of PRAYER_NAMES) {
					const amount = data.amounts[prayer];
					if (amount > 0) await setDebtManual(prayer, amount);
				}
			}
			setStep('objective');
		} catch {
			setSaveError(t('onboarding.saveError'));
		} finally {
			setSaving(false);
		}
	}

	async function handleObjectiveNext(period: Period, target: number) {
		setSaving(true);
		setSaveError(null);
		try {
			await setObjective(period, target);
			setStep('summary');
		} catch {
			setSaveError(t('onboarding.saveError'));
		} finally {
			setSaving(false);
		}
	}

	return (
		<motion.div
			className="fixed inset-0 z-50 flex flex-col"
			style={{ background: '#1A1A1C' }}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.25 }}
		>
			<div className="mx-auto flex w-full max-w-lg flex-1 flex-col pt-14">
				<AnimatePresence mode="wait">
					{step === 'welcome' && <WelcomeStep onNext={() => setStep('debt')} onSkip={onComplete} />}
					{step === 'debt' && (
						<DebtStep
							onNext={handleDebtNext}
							onSkip={() => setStep('objective')}
							saving={saving}
							saveError={saveError}
						/>
					)}
					{step === 'objective' && (
						<ObjectiveStep onNext={handleObjectiveNext} saving={saving} saveError={saveError} />
					)}
					{step === 'summary' && <SummaryStep onComplete={onComplete} />}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
