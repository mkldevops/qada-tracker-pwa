import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { PRAYER_CONFIG } from '@/constants/prayers';
import { usePrayerStore, useTotalRemaining } from '@/stores/prayerStore';
import type { Period } from '@/types';
import { PRAYER_NAMES } from '@/types';

type Step = 'welcome' | 'debt' | 'objective' | 'summary';

const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };

const PERIODS: { value: Period; label: string }[] = [
	{ value: 'daily', label: 'Jour' },
	{ value: 'weekly', label: 'Semaine' },
	{ value: 'monthly', label: 'Mois' },
];

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

function WelcomeStep({ onNext }: { onNext: () => void }) {
	return (
		<motion.div
			key="welcome"
			className="flex flex-1 flex-col items-center justify-center px-7 gap-6 text-center"
			initial={{ opacity: 0, x: 40 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -40 }}
			transition={spring}
		>
			<motion.div
				className="flex flex-col items-center gap-3"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.05, ...spring }}
			>
				<p
					className="font-display text-[72px] font-normal leading-none"
					style={{ color: '#C9A962' }}
				>
					قضاء
				</p>
				<h1 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
					Bienvenue
				</h1>
				<p className="text-sm leading-relaxed max-w-xs" style={{ color: '#6E6E70' }}>
					Configurez votre rattrapage de prières en 2 étapes
				</p>
			</motion.div>

			<motion.div
				className="w-full flex flex-col gap-3"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.15, ...spring }}
			>
				<div
					className="rounded-[20px] p-5 flex flex-col gap-3 text-left"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					{[
						{ n: '1', label: 'Estimez votre dette', sub: 'Années manquées → total calculé' },
						{ n: '2', label: 'Définissez un objectif', sub: 'Quotidien, hebdo ou mensuel' },
					].map(({ n, label, sub }) => (
						<div key={n} className="flex items-center gap-3">
							<div
								className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
								style={{ background: '#C9A96220', color: '#C9A962' }}
							>
								{n}
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
									{label}
								</span>
								<span className="text-xs" style={{ color: '#6E6E70' }}>
									{sub}
								</span>
							</div>
						</div>
					))}
				</div>

				<motion.button
					type="button"
					onClick={onNext}
					className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px]"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
					whileTap={{ scale: 0.95 }}
					whileHover={{ scale: 1.02 }}
				>
					COMMENCER
				</motion.button>
			</motion.div>
		</motion.div>
	);
}

function DebtStep({ onNext }: { onNext: (years: number, excluded: number) => void }) {
	const [years, setYears] = useState('');
	const [isFemme, setIsFemme] = useState(false);
	const [avgHaydDays, setAvgHaydDays] = useState('6');
	const [excludedDays, setExcludedDays] = useState('0');

	const parsedYears = parseFloat(years) || 0;
	const haydExclusion = isFemme ? Math.round(parsedYears * (parseFloat(avgHaydDays) || 6) * 12) : 0;
	const totalExcluded = (parseInt(excludedDays, 10) || 0) + haydExclusion;
	const effectiveDays = Math.max(0, Math.round(parsedYears * 365.25) - totalExcluded);
	const totalPreview = effectiveDays * PRAYER_NAMES.length;

	const canProceed = parsedYears > 0;

	return (
		<motion.div
			key="debt"
			className="flex flex-1 flex-col px-7 pt-10 pb-8 gap-6"
			initial={{ opacity: 0, x: 40 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -40 }}
			transition={spring}
		>
			<div className="flex flex-col gap-3">
				<StepIndicator current={1} total={2} />
				<div className="flex flex-col gap-1">
					<h2 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
						Votre dette
					</h2>
					<p className="text-sm" style={{ color: '#6E6E70' }}>
						Estimez le nombre d'années de prières manquées
					</p>
				</div>
			</div>

			<div
				className="flex flex-col gap-4 rounded-[20px] p-5"
				style={{ background: '#242426', border: '1px solid #3A3A3C' }}
			>
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<label htmlFor="ob-years" className="text-xs font-medium" style={{ color: '#6E6E70' }}>
							Années manquées
						</label>
						<input
							id="ob-years"
							type="number"
							value={years}
							onChange={(e) => setYears(e.target.value)}
							placeholder="ex : 5.5"
							min="0"
							step="0.5"
							style={inputStyle}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="ob-excluded"
							className="text-xs font-medium"
							style={{ color: '#6E6E70' }}
						>
							Jours exclus
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
							Femme
						</span>
						<span className="text-[11px]" style={{ color: '#6E6E70' }}>
							Déduire les jours de hayd
						</span>
					</div>
					<button
						type="button"
						onClick={() => setIsFemme((v) => !v)}
						className="relative h-7 w-12 rounded-full transition-colors"
						style={{ background: isFemme ? '#C9A962' : '#3A3A3C' }}
					>
						<span
							className="absolute top-1 h-5 w-5 rounded-full transition-all"
							style={{ background: '#F5F5F0', left: isFemme ? '50%' : '4px' }}
						/>
					</button>
				</div>

				{isFemme && (
					<motion.div
						className="flex flex-col gap-1.5"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={spring}
					>
						<label htmlFor="ob-hayd" className="text-xs font-medium" style={{ color: '#6E6E70' }}>
							Moy. jours de hayd / mois
						</label>
						<input
							id="ob-hayd"
							type="number"
							value={avgHaydDays}
							onChange={(e) => setAvgHaydDays(e.target.value)}
							placeholder="6"
							min="1"
							max="15"
							style={inputStyle}
						/>
						{parsedYears > 0 && (
							<p className="text-[11px]" style={{ color: '#6E9E6E' }}>
								≈ {haydExclusion} jours déduits ({totalExcluded} au total)
							</p>
						)}
					</motion.div>
				)}
			</div>

			<AnimatePresence>
				{canProceed && (
					<motion.div
						className="rounded-[20px] p-5 flex flex-col gap-3"
						style={{ background: '#1A2820', border: '1px solid #6E9E6E40' }}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						transition={spring}
					>
						<p className="text-[11px] font-medium tracking-[2px]" style={{ color: '#6E9E6E' }}>
							APERÇU
						</p>
						<div className="flex justify-between items-center">
							<span className="text-sm" style={{ color: '#6E6E70' }}>
								Total estimé
							</span>
							<span className="text-xl font-semibold tabular-nums" style={{ color: '#F5F5F0' }}>
								{totalPreview.toLocaleString()}
							</span>
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

			<div className="mt-auto flex flex-col gap-3">
				<motion.button
					type="button"
					onClick={() => onNext(parsedYears, totalExcluded)}
					disabled={!canProceed}
					className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
					whileTap={{ scale: 0.95 }}
					whileHover={{ scale: 1.02 }}
				>
					SUIVANT
				</motion.button>
			</div>
		</motion.div>
	);
}

function ObjectiveStep({ onNext }: { onNext: (period: Period, target: number) => void }) {
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
		const count = Math.ceil(totalRemaining / effectiveTarget);
		const unit = objPeriod === 'daily' ? 'jour' : objPeriod === 'weekly' ? 'semaine' : 'mois';
		const unitPlural =
			objPeriod === 'daily' ? 'jours' : objPeriod === 'weekly' ? 'semaines' : 'mois';
		return `${count} ${count > 1 ? unitPlural : unit}`;
	})();

	return (
		<motion.div
			key="objective"
			className="flex flex-1 flex-col px-7 pt-10 pb-8 gap-6"
			initial={{ opacity: 0, x: 40 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -40 }}
			transition={spring}
		>
			<div className="flex flex-col gap-3">
				<StepIndicator current={2} total={2} />
				<div className="flex flex-col gap-1">
					<h2 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
						Votre objectif
					</h2>
					<p className="text-sm" style={{ color: '#6E6E70' }}>
						Combien de prières voulez-vous rattraper ?
					</p>
				</div>
			</div>

			<div
				className="flex flex-col gap-4 rounded-[20px] p-5"
				style={{ background: '#242426', border: '1px solid #3A3A3C' }}
			>
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
									: { background: '#1A1A1C', border: '1px solid #3A3A3C', color: '#4A4A4C' }
							}
						>
							{label}
						</button>
					))}
				</div>

				<div className="flex flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<label htmlFor="ob-target" className="text-xs font-medium" style={{ color: '#6E6E70' }}>
							Cible par{' '}
							{objPeriod === 'daily' ? 'jour' : objPeriod === 'weekly' ? 'semaine' : 'mois'}
						</label>
						{suggestion && (
							<button
								type="button"
								onClick={() => setObjTarget(String(suggestion))}
								className="text-[11px] font-medium"
								style={{ color: '#C9A962' }}
							>
								Suggestion : {suggestion}
							</button>
						)}
					</div>
					<input
						id="ob-target"
						type="number"
						value={objTarget}
						onChange={(e) => setObjTarget(e.target.value)}
						placeholder={suggestion ? `ex : ${suggestion}` : 'Nombre cible'}
						min="1"
						style={inputStyle}
					/>
				</div>

				<AnimatePresence>
					{estimation && (
						<motion.div
							className="flex items-center justify-between rounded-xl px-4 py-3"
							style={{ background: '#1A1A1C' }}
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							transition={spring}
						>
							<span className="text-xs" style={{ color: '#6E6E70' }}>
								Estimation d'achèvement
							</span>
							<span className="text-sm font-semibold tabular-nums" style={{ color: '#C9A962' }}>
								≈ {estimation}
							</span>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="mt-auto flex flex-col gap-3">
				<motion.button
					type="button"
					onClick={() => effectiveTarget && onNext(objPeriod, effectiveTarget)}
					disabled={!effectiveTarget}
					className="w-full rounded-[28px] py-4 text-base font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
					whileTap={{ scale: 0.95 }}
					whileHover={{ scale: 1.02 }}
				>
					TERMINER
				</motion.button>
				<button
					type="button"
					onClick={() => onNext(objPeriod, suggestion ?? 10)}
					className="text-sm py-2"
					style={{ color: '#4A4A4C' }}
				>
					Passer cette étape
				</button>
			</div>
		</motion.div>
	);
}

function SummaryStep({ onComplete }: { onComplete: () => void }) {
	const totalRemaining = useTotalRemaining();
	const activeObjective = usePrayerStore((s) => s.activeObjective);

	return (
		<motion.div
			key="summary"
			className="flex flex-1 flex-col items-center justify-center px-7 gap-6 text-center"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
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
				<motion.div
					className="absolute w-24 h-24 rounded-full"
					style={{ border: '2px solid #C9A96240' }}
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 2.5, opacity: 0 }}
					transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
				/>
				<motion.div
					className="absolute w-24 h-24 rounded-full"
					style={{ border: '2px solid #C9A96230' }}
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 3.5, opacity: 0 }}
					transition={{ delay: 0.6, duration: 1.5, ease: 'easeOut' }}
				/>
			</div>

			<motion.div
				className="flex flex-col items-center gap-2"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.25, ...spring }}
			>
				<h2 className="font-display text-4xl font-normal" style={{ color: '#F5F5F0' }}>
					Tout est prêt !
				</h2>
				<p className="text-sm" style={{ color: '#6E6E70' }}>
					Voici un récapitulatif de votre configuration
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
						Prières à rattraper
					</span>
					<span className="text-xl font-semibold tabular-nums" style={{ color: '#C9A962' }}>
						{totalRemaining.toLocaleString()}
					</span>
				</div>
				<div style={{ height: 1, background: '#2A2A2C' }} />
				<div className="flex items-center justify-between px-5 py-4">
					<span className="text-sm" style={{ color: '#6E6E70' }}>
						Objectif
					</span>
					<span className="text-sm font-semibold" style={{ color: '#F5F5F0' }}>
						{activeObjective
							? `${activeObjective.target} / ${activeObjective.period === 'daily' ? 'jour' : activeObjective.period === 'weekly' ? 'semaine' : 'mois'}`
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
				COMMENCER
			</motion.button>
		</motion.div>
	);
}

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
	const { setDebtFromYears, setObjective } = usePrayerStore();
	const [step, setStep] = useState<Step>('welcome');

	async function handleDebtNext(years: number, excluded: number) {
		await setDebtFromYears(years, excluded);
		setStep('objective');
	}

	async function handleObjectiveNext(period: Period, target: number) {
		await setObjective(period, target);
		setStep('summary');
	}

	return (
		<motion.div
			className="fixed inset-0 z-50 flex flex-col"
			style={{ background: '#1A1A1C' }}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<div className="mx-auto flex w-full max-w-lg flex-1 flex-col pt-14">
				<AnimatePresence mode="wait">
					{step === 'welcome' && <WelcomeStep onNext={() => setStep('debt')} />}
					{step === 'debt' && <DebtStep onNext={handleDebtNext} />}
					{step === 'objective' && <ObjectiveStep onNext={handleObjectiveNext} />}
					{step === 'summary' && <SummaryStep onComplete={onComplete} />}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
