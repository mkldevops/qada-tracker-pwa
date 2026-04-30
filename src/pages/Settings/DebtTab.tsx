import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { HaydStepper } from '@/components/HaydStepper';
import { ObjectiveCard } from '@/components/ObjectiveCard';
import { track } from '@/lib/analytics';
import { usePrayerStore, useTotalRemaining } from '@/stores/prayerStore';
import type { Period } from '@/types';

export function DebtTab({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
	const { t } = useTranslation();
	const {
		setObjective,
		activeObjective,
		estimationWindowDays,
		setEstimationWindowDays,
		estimationHaydDays,
		setEstimationHaydDays,
	} = usePrayerStore();
	const totalRemaining = useTotalRemaining();
	const [objPeriod, setObjPeriod] = useState<Period>(() => activeObjective?.period ?? 'daily');
	const [objTarget, setObjTarget] = useState<number>(() => activeObjective?.target ?? 0);
	const [error, setError] = useState<string | null>(null);
	const [localHaydValue, setLocalHaydValue] = useState(() => estimationHaydDays || 6);

	const haydEnabled = estimationHaydDays > 0;

	function handleHaydToggle() {
		if (haydEnabled) {
			setEstimationHaydDays(0);
		} else {
			setEstimationHaydDays(localHaydValue);
		}
	}

	function handleHaydChange(n: number) {
		setLocalHaydValue(n);
		setEstimationHaydDays(n);
	}

	const WINDOW_OPTIONS: { value: number | null; label: string }[] = [
		{ value: null, label: t('settings.estimationWindowAllTime') },
		{ value: 10, label: t('settings.estimationWindow10d') },
		{ value: 30, label: t('settings.estimationWindow30d') },
	];

	function handlePeriodChange(newPeriod: Period) {
		const perDay =
			objPeriod === 'daily' ? objTarget : objPeriod === 'weekly' ? objTarget / 7 : objTarget / 30;
		const newTarget =
			newPeriod === 'daily' ? perDay : newPeriod === 'weekly' ? perDay * 7 : perDay * 30;
		setObjPeriod(newPeriod);
		setObjTarget(Math.round(Math.max(1, newTarget)));
	}

	const handleSetObjective = async () => {
		if (objTarget > 0) {
			try {
				await setObjective(objPeriod, objTarget);
			} catch {
				setError(t('settings.importError'));
			}
		}
	};

	const hasValidTarget = objTarget > 0;

	return (
		<>
			<CollapsibleSection label={t('settings.objective')} defaultOpen={true}>
				<div className="flex flex-col gap-4 rounded-[20px] bg-surface border border-border p-5">
					{activeObjective && (
						<p className="text-xs text-muted">
							{t('settings.currentObjective', {
								target: activeObjective.target,
								period: t(
									`common.${activeObjective.period === 'daily' ? 'day' : activeObjective.period === 'weekly' ? 'week' : 'month'}`,
								),
							})}
						</p>
					)}
					{error && <p className="text-[11px] font-medium text-danger">{error}</p>}

					<ObjectiveCard
						period={objPeriod}
						onPeriodChange={handlePeriodChange}
						target={objTarget}
						onTargetChange={setObjTarget}
						totalRemaining={totalRemaining}
					/>

					<button
						type="button"
						onClick={handleSetObjective}
						disabled={!hasValidTarget}
						className="gradient-gold rounded-[22px] py-3 text-[13px] font-bold text-background transition-opacity disabled:opacity-30"
					>
						{t('settings.apply')}
					</button>
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t('settings.estimation')} defaultOpen={false}>
				<div className="flex flex-col gap-4 rounded-[20px] bg-surface border border-border p-5">
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium text-foreground">
							{t('settings.estimationWindow')}
						</span>
						<span className="text-[11px] text-muted">{t('settings.estimationWindowDesc')}</span>
					</div>
					<div className="flex gap-2">
						{WINDOW_OPTIONS.map(({ value, label }) => (
							<button
								type="button"
								key={String(value)}
								onClick={() => setEstimationWindowDays(value)}
								className={`flex-1 rounded-[20px] py-2.5 text-[13px] transition-colors ${
									estimationWindowDays === value
										? 'bg-gold text-background font-semibold'
										: 'bg-background border border-border text-tertiary font-medium'
								}`}
							>
								{label}
							</button>
						))}
					</div>

					<div className="h-px bg-border" />

					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-medium text-foreground">
								{t('settings.estimationHayd')}
							</span>
							<span className="text-[11px] text-muted">{t('settings.estimationHaydDesc')}</span>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={haydEnabled}
							aria-label={t('settings.estimationHayd')}
							onClick={handleHaydToggle}
							className="relative flex shrink-0 items-center rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
						>
							<span
								className={`relative h-7 w-12 rounded-full transition-colors ${haydEnabled ? 'bg-gold' : 'bg-border'}`}
							>
								<span
									className="absolute top-1 h-5 w-5 rounded-full bg-foreground transition-all"
									style={{ left: haydEnabled ? '50%' : '4px' }}
								/>
							</span>
						</button>
					</div>

					{haydEnabled && (
						<>
							<div className="h-px bg-border" />
							<div className="flex items-center justify-between">
								<span className="text-[11px] text-muted">{t('settings.haydAvg')}</span>
								<HaydStepper value={localHaydValue} onChange={handleHaydChange} min={1} max={15} />
							</div>
						</>
					)}
				</div>
			</CollapsibleSection>

			{onRestartOnboarding && (
				<button
					type="button"
					onClick={() => {
						track({ name: 'restart_onboarding', data: { from: 'settings' } });
						onRestartOnboarding?.();
					}}
					className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4 bg-surface border border-border"
				>
					<RotateCcw size={16} className="text-gold" />
					<span className="text-xs font-semibold tracking-[1px] text-gold">
						{t('settings.restartOnboarding')}
					</span>
				</button>
			)}
		</>
	);
}
