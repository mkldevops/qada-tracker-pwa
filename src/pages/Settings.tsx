import { RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { useDebts, usePrayerStore } from '@/stores/prayerStore';
import type { Period, PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

const PERIODS: { value: Period; label: string }[] = [
	{ value: 'daily', label: 'Jour' },
	{ value: 'weekly', label: 'Semaine' },
	{ value: 'monthly', label: 'Mois' },
];

export function Settings({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
	const { setDebtManual, setDebtFromYears, setObjective, resetAll, activeObjective } =
		usePrayerStore();
	const debts = useDebts();

	const [years, setYears] = useState('');
	const [excludedDays, setExcludedDays] = useState('0');
	const [isFemme, setIsFemme] = useState(false);
	const [avgHaydDays, setAvgHaydDays] = useState('6');
	const [manualAmounts, setManualAmounts] = useState<Partial<Record<PrayerName, string>>>({});
	const [objPeriod, setObjPeriod] = useState<Period>('daily');
	const [objTarget, setObjTarget] = useState('');

	const haydExclusion = isFemme
		? Math.round((parseFloat(years) || 0) * (parseFloat(avgHaydDays) || 6) * 12)
		: 0;
	const totalExcluded = (parseInt(excludedDays, 10) || 0) + haydExclusion;

	const handleSetDebtFromYears = async () => {
		const y = parseFloat(years);
		if (!Number.isNaN(y) && y > 0) {
			await setDebtFromYears(y, totalExcluded);
			setYears('');
		}
	};

	const handleManualDebt = async (prayer: PrayerName) => {
		const val = parseInt(manualAmounts[prayer] ?? '', 10);
		if (!Number.isNaN(val) && val >= 0) {
			await setDebtManual(prayer, val);
			setManualAmounts((prev) => ({ ...prev, [prayer]: '' }));
		}
	};

	const handleSetObjective = async () => {
		const target = parseInt(objTarget, 10);
		if (!Number.isNaN(target) && target > 0) {
			await setObjective(objPeriod, target);
			setObjTarget('');
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

	return (
		<div className="space-y-6 px-7 pb-4 pt-1">
			<h1 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
				Réglages
			</h1>

			{/* Section 1: Debt from years */}
			<section className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					CALCULER LA DETTE
				</p>
				<div
					className="flex flex-col gap-4 rounded-[20px] p-5"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="input-years"
								className="text-xs font-medium"
								style={{ color: '#6E6E70' }}
							>
								Années manquées
							</label>
							<input
								id="input-years"
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
								htmlFor="input-excluded"
								className="text-xs font-medium"
								style={{ color: '#6E6E70' }}
							>
								Autres jours exclus
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

					{/* Option femme */}
					<div style={{ height: 1, background: '#2A2A2C' }} />
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
								Femme
							</span>
							<span className="text-[11px]" style={{ color: '#6E6E70' }}>
								Déduire les jours de menstrues (hayd)
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
								Moy. jours de hayd / mois
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
									≈ {haydExclusion} jours déduits ({totalExcluded} au total)
								</p>
							)}
						</div>
					)}

					<button
						type="button"
						onClick={handleSetDebtFromYears}
						disabled={!years || parseFloat(years) <= 0}
						className="flex w-full items-center justify-center rounded-3xl py-3 text-[13px] font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30"
						style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
					>
						APPLIQUER
					</button>
				</div>
			</section>

			{/* Section 2: Manual adjustment */}
			<section className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					AJUSTEMENT MANUEL
				</p>
				<div
					className="overflow-hidden rounded-[20px]"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					{PRAYER_NAMES.map((prayer, i) => {
						const cfg = PRAYER_CONFIG[prayer];
						return (
							<div key={prayer}>
								{i > 0 && <div style={{ height: 1, background: '#2A2A2C' }} />}
								<div className="flex items-center gap-3 px-5 py-3">
									<span
										className="w-20 font-display text-base font-medium"
										style={{ color: cfg.hex }}
									>
										{cfg.labelFr}
									</span>
									<span className="w-12 text-right text-sm" style={{ color: '#6E6E70' }}>
										{debts[prayer]?.remaining ?? 0}
									</span>
									<input
										type="number"
										className="flex-1"
										value={manualAmounts[prayer] ?? ''}
										onChange={(e) =>
											setManualAmounts((prev) => ({ ...prev, [prayer]: e.target.value }))
										}
										placeholder="Nouveau total"
										min="0"
										style={{ ...inputStyle, height: 36, fontSize: 13 }}
									/>
									<button
										type="button"
										onClick={() => handleManualDebt(prayer)}
										disabled={!manualAmounts[prayer]}
										className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-30"
										style={{ background: '#3A3A3C', color: '#C9A962' }}
									>
										OK
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* Section 3: Objective */}
			<section className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					OBJECTIF
				</p>
				<div
					className="flex flex-col gap-4 rounded-[20px] p-5"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					{activeObjective && (
						<p className="text-xs" style={{ color: '#6E6E70' }}>
							Actuel : {activeObjective.target} /
							{activeObjective.period === 'daily'
								? ' jour'
								: activeObjective.period === 'weekly'
									? ' semaine'
									: ' mois'}
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
										: { background: '#1A1A1C', border: '1px solid #3A3A3C', color: '#4A4A4C' }
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
							placeholder="Nombre cible"
							min="1"
							style={{ ...inputStyle, flex: 1 }}
						/>
						<button
							type="button"
							onClick={handleSetObjective}
							disabled={!objTarget}
							className="rounded-[22px] px-6 text-[13px] font-bold transition-opacity disabled:opacity-30"
							style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
						>
							OK
						</button>
					</div>
				</div>
			</section>

			{onRestartOnboarding && (
				<section className="flex flex-col gap-2.5">
					<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
						CONFIGURATION
					</p>
					<button
						type="button"
						onClick={onRestartOnboarding}
						className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
						style={{ background: '#242426', border: '1px solid #3A3A3C' }}
					>
						<RotateCcw size={16} style={{ color: '#C9A962' }} />
						<span className="text-xs font-semibold tracking-[1px]" style={{ color: '#C9A962' }}>
							RECONFIGURER L'ONBOARDING
						</span>
					</button>
				</section>
			)}

			{/* Danger zone */}
			<section className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					ZONE DANGER
				</p>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
							style={{ background: '#2A1515', border: '1px solid #D45F5F33' }}
						>
							<Trash2 size={18} style={{ color: '#D45F5F' }} />
							<span className="text-xs font-semibold tracking-[1px]" style={{ color: '#D45F5F' }}>
								RÉINITIALISER TOUTES LES DONNÉES
							</span>
						</button>
					</AlertDialogTrigger>
					<AlertDialogContent style={{ background: '#242426', border: '1px solid #3A3A3C' }}>
						<AlertDialogHeader>
							<AlertDialogTitle style={{ color: '#F5F5F0' }}>Tout réinitialiser ?</AlertDialogTitle>
							<AlertDialogDescription style={{ color: '#6E6E70' }}>
								Efface tous les logs et remet les compteurs à zéro. Irréversible.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel
								style={{ background: '#2A2A2C', color: '#F5F5F0', border: 'none' }}
							>
								Annuler
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={resetAll}
								style={{ background: '#D45F5F', color: '#F5F5F0' }}
							>
								Réinitialiser
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</section>
		</div>
	);
}
