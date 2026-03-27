import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HaydStepper } from '@/components/HaydStepper';
import { ObjectiveCard } from '@/components/ObjectiveCard';
import { PRAYER_CONFIG } from '@/constants/prayers';
import { spring, springSnappy } from '@/lib/animations';
import { usePrayerStore, useTotalRemaining } from '@/stores/prayerStore';
import type { Period, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

type Step = 'welcome' | 'debt' | 'objective' | 'summary';
type DebtMode = 'years' | 'manual';
type DebtData =
	| { mode: 'years'; years: number; excluded: number }
	| { mode: 'manual'; amounts: Record<PrayerName, number> };

const inputStyle = {
	background: 'var(--background)',
	border: '1px solid var(--border)',
	borderRadius: 12,
	color: 'var(--text-primary)',
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
						background: n <= current ? 'var(--gold)' : 'var(--border)',
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
			style={{ background: '#2A1515', border: '1px solid #D45F5F40', color: 'var(--danger)' }}
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
			className="flex flex-1 flex-col min-h-0 items-center justify-center px-7 gap-8 text-center overflow-y-auto"
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
					style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))' }}
					animate={{ boxShadow: ['0 0 0px #C9A96240', '0 0 30px #C9A96240', '0 0 0px #C9A96240'] }}
					transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
				>
					<p
						className="font-display text-4xl font-normal leading-none"
						style={{ color: 'var(--background)' }}
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
					<h1
						className="font-display text-4xl font-normal"
						style={{ color: 'var(--text-primary)' }}
					>
						{t('onboarding.welcome')}
					</h1>
					<p
						className="text-sm leading-relaxed max-w-[260px]"
						style={{ color: 'var(--text-secondary)' }}
					>
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
					style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
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
									background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
									color: 'var(--background)',
								}}
							>
								{n}
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
									{label}
								</span>
								<span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
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
					style={{
						background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
						color: 'var(--background)',
					}}
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
					style={{ color: 'var(--text-tertiary)' }}
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
	const [missedYears, setMissedYears] = useState(0);
	const [missedMonths, setMissedMonths] = useState(0);
	const [isFemme, setIsFemme] = useState(false);
	const [avgHaydDays, setAvgHaydDays] = useState(6);
	const [excludedDays, setExcludedDays] = useState('0');

	// Manual mode
	const [manualAmounts, setManualAmounts] = useState<Partial<Record<PrayerName, string>>>({});

	// Years computations
	const totalYears = missedYears + missedMonths / 12;
	const haydExclusion = isFemme
		? Math.round(totalYears * (Math.min(15, Math.max(1, avgHaydDays)) * 12))
		: 0;
	const totalExcluded = Math.max(0, parseInt(excludedDays, 10) || 0) + haydExclusion;
	const effectiveDays = Math.max(0, Math.round(totalYears * 365.25) - totalExcluded);
	const totalPreview = effectiveDays * PRAYER_NAMES.length;

	// Manual computations
	const manualTotals = Object.fromEntries(
		PRAYER_NAMES.map((p) => [p, Math.max(0, parseInt(manualAmounts[p] ?? '0', 10) || 0)]),
	) as Record<PrayerName, number>;
	const manualTotal = Object.values(manualTotals).reduce((s, v) => s + v, 0);

	const canProceed = debtMode === 'years' ? missedYears > 0 || missedMonths > 0 : manualTotal > 0;

	function handleSubmit() {
		if (debtMode === 'years') {
			onNext({ mode: 'years', years: totalYears, excluded: totalExcluded });
		} else {
			onNext({ mode: 'manual', amounts: manualTotals });
		}
	}

	return (
		<motion.div
			key="debt"
			className="flex flex-1 flex-col min-h-0 px-7 pt-10 pb-8 gap-5 overflow-y-auto"
			initial={{ opacity: 0, x: 60 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -60 }}
			transition={spring}
		>
			<div className="flex flex-col gap-3">
				<StepIndicator current={1} total={2} />
				<h2 className="font-display text-3xl font-normal" style={{ color: 'var(--text-primary)' }}>
					{t('onboarding.debtTitle')}
				</h2>
			</div>

			{/* Mode switcher */}
			<div
				className="flex gap-1.5 rounded-2xl p-1"
				style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
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
								background: active ? 'var(--gold)' : 'transparent',
								color: active ? 'var(--background)' : 'var(--text-secondary)',
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
						style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={spring}
					>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-3">
								<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
									{t('onboarding.missedYears')}
								</span>
								<div className="grid grid-cols-2 gap-3">
									<div
										className="flex flex-col items-center gap-3 rounded-2xl py-5"
										style={{ background: 'var(--background)' }}
									>
										<span
											className="text-[10px] font-semibold tracking-[1.5px] uppercase"
											style={{ color: 'var(--text-secondary)' }}
										>
											{t('common.years')}
										</span>
										<span
											className="text-3xl font-semibold tabular-nums"
											style={{ color: 'var(--text-primary)' }}
										>
											{missedYears}
										</span>
										<div className="flex items-center gap-3">
											<motion.button
												type="button"
												whileTap={{ scale: 0.88 }}
												onClick={() => setMissedYears((v) => Math.max(0, v - 1))}
												disabled={missedYears <= 0}
												aria-label={`− ${t('common.years')}`}
												className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold disabled:opacity-30"
												style={{
													background: 'var(--surface-raised)',
													color: 'var(--text-primary)',
												}}
											>
												−
											</motion.button>
											<motion.button
												type="button"
												whileTap={{ scale: 0.88 }}
												onClick={() => setMissedYears((v) => Math.min(80, v + 1))}
												disabled={missedYears >= 80}
												aria-label={`+ ${t('common.years')}`}
												className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold disabled:opacity-30"
												style={{
													background: 'var(--surface-raised)',
													color: 'var(--text-primary)',
												}}
											>
												+
											</motion.button>
										</div>
									</div>
									<div
										className="flex flex-col items-center gap-3 rounded-2xl py-5"
										style={{ background: 'var(--background)' }}
									>
										<span
											className="text-[10px] font-semibold tracking-[1.5px] uppercase"
											style={{ color: 'var(--text-secondary)' }}
										>
											{t('common.months')}
										</span>
										<span
											className="text-3xl font-semibold tabular-nums"
											style={{ color: 'var(--text-primary)' }}
										>
											{missedMonths}
										</span>
										<div className="flex items-center gap-3">
											<motion.button
												type="button"
												whileTap={{ scale: 0.88 }}
												onClick={() => setMissedMonths((v) => Math.max(0, v - 1))}
												disabled={missedMonths <= 0}
												aria-label={`− ${t('common.months')}`}
												className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold disabled:opacity-30"
												style={{
													background: 'var(--surface-raised)',
													color: 'var(--text-primary)',
												}}
											>
												−
											</motion.button>
											<motion.button
												type="button"
												whileTap={{ scale: 0.88 }}
												onClick={() => setMissedMonths((v) => Math.min(11, v + 1))}
												disabled={missedMonths >= 11}
												aria-label={`+ ${t('common.months')}`}
												className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold disabled:opacity-30"
												style={{
													background: 'var(--surface-raised)',
													color: 'var(--text-primary)',
												}}
											>
												+
											</motion.button>
										</div>
									</div>
								</div>
							</div>
							<div style={{ height: 1, background: 'var(--surface-raised)' }} />
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="ob-excluded"
									className="text-[11px] font-medium"
									style={{ color: 'var(--text-secondary)' }}
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

						<div style={{ height: 1, background: 'var(--surface-raised)' }} />

						<div className="flex items-center justify-between">
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
									{t('onboarding.female')}
								</span>
								<span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
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
								style={{ background: isFemme ? 'var(--gold)' : 'var(--border)' }}
							>
								<motion.span
									className="absolute top-1 h-5 w-5 rounded-full"
									style={{ background: 'var(--text-primary)' }}
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
									<div className="flex items-center justify-between">
										<span
											className="text-xs font-medium"
											style={{ color: 'var(--text-secondary)' }}
										>
											{t('onboarding.haydAvg')}
										</span>
										<HaydStepper value={avgHaydDays} onChange={setAvgHaydDays} min={1} max={15} />
									</div>
									{totalYears > 0 && (
										<motion.p
											className="text-[11px]"
											style={{ color: 'var(--sage)' }}
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
						style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
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
									{i > 0 && <div style={{ height: 1, background: 'var(--surface-raised)' }} />}
									<div className="flex items-center gap-3 px-5 py-3">
										<div className="flex flex-col gap-0.5 w-20">
											<span
												className="font-display text-base font-medium"
												style={{ color: cfg.hex }}
											>
												{cfg.labelFr}
											</span>
											<span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
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
									<span className="text-xs" style={{ color: 'var(--sage)' }}>
										{t('onboarding.total')}
									</span>
									<span
										className="text-base font-semibold tabular-nums"
										style={{ color: 'var(--text-primary)' }}
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
						<p className="text-[11px] font-medium tracking-[2px]" style={{ color: 'var(--sage)' }}>
							{t('onboarding.preview')}
						</p>
						<div className="flex justify-between items-center">
							<span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
								{t('onboarding.estimatedTotal')}
							</span>
							<motion.span
								key={totalPreview}
								className="text-xl font-semibold tabular-nums"
								style={{ color: 'var(--text-primary)' }}
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
									<span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
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
					style={{
						background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
						color: 'var(--background)',
					}}
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
					style={{ color: 'var(--text-tertiary)' }}
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
				? totalRemaining / (365 * 5)
				: objPeriod === 'weekly'
					? totalRemaining / (52 * 5)
					: totalRemaining / (12 * 5);
		return Math.max(1, Math.round(raw));
	})();

	const parsedTarget = parseInt(objTarget, 10);
	const effectiveTarget = !Number.isNaN(parsedTarget) && parsedTarget > 0 ? parsedTarget : null;

	return (
		<motion.div
			key="objective"
			className="flex flex-1 flex-col min-h-0 px-7 pt-10 pb-8 gap-6 overflow-y-auto"
			initial={{ opacity: 0, x: 60 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -60 }}
			transition={spring}
		>
			<div className="flex flex-col gap-3">
				<StepIndicator current={2} total={2} />
				<div className="flex flex-col gap-1">
					<h2
						className="font-display text-3xl font-normal"
						style={{ color: 'var(--text-primary)' }}
					>
						{t('onboarding.objectiveTitle')}
					</h2>
					<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
						{t('onboarding.objectiveSubtitle')}
					</p>
				</div>
			</div>

			<div
				className="flex flex-col gap-4 rounded-[20px] p-5"
				style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
			>
				<ObjectiveCard
					period={objPeriod}
					onPeriodChange={setObjPeriod}
					target={objTarget}
					onTargetChange={setObjTarget}
					totalRemaining={totalRemaining}
					inputId="ob-target"
				/>
			</div>

			<AnimatePresence>{saveError && <ErrorBanner message={saveError} />}</AnimatePresence>

			<div className="mt-auto flex flex-col gap-3">
				<motion.button
					type="button"
					onClick={() => effectiveTarget && onNext(objPeriod, effectiveTarget)}
					disabled={!effectiveTarget || saving}
					className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30"
					style={{
						background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
						color: 'var(--background)',
					}}
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
					style={{ color: 'var(--text-tertiary)' }}
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
			className="flex flex-1 flex-col min-h-0 items-center justify-center px-7 gap-7 text-center overflow-y-auto"
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
						<CheckCircle2 size={72} style={{ color: 'var(--gold)' }} />
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
				<h2 className="font-display text-4xl font-normal" style={{ color: 'var(--text-primary)' }}>
					{t('onboarding.summaryTitle')}
				</h2>
				<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
					{t('onboarding.summarySubtitle')}
				</p>
			</motion.div>

			<motion.div
				className="w-full rounded-[20px] overflow-hidden"
				style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.35, ...spring }}
			>
				<div className="flex items-center justify-between px-5 py-4">
					<span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
						{t('onboarding.prayersToCatch')}
					</span>
					<span className="text-xl font-semibold tabular-nums" style={{ color: 'var(--gold)' }}>
						{totalRemaining.toLocaleString()}
					</span>
				</div>
				<div style={{ height: 1, background: 'var(--surface-raised)' }} />
				<div className="flex items-center justify-between px-5 py-4">
					<span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
						{t('onboarding.summaryObjective')}
					</span>
					<span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
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
				style={{
					background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
					color: 'var(--background)',
				}}
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
			style={{ background: 'var(--background)' }}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.25 }}
		>
			<div className="mx-auto flex w-full max-w-lg flex-1 flex-col min-h-0 pt-14">
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
