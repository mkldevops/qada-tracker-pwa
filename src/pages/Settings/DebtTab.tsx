import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ObjectiveCard } from '@/components/ObjectiveCard';
import { usePrayerStore, useTotalRemaining } from '@/stores/prayerStore';
import type { Period } from '@/types';

export function DebtTab({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
	const { t } = useTranslation();
	const { setObjective, activeObjective } = usePrayerStore();
	const totalRemaining = useTotalRemaining();
	const [objPeriod, setObjPeriod] = useState<Period>('daily');
	const [objTarget, setObjTarget] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);

	const handleSetObjective = async () => {
		if (objTarget > 0) {
			try {
				await setObjective(objPeriod, objTarget);
				setObjTarget(0);
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
						onPeriodChange={setObjPeriod}
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

			{onRestartOnboarding && (
				<button
					type="button"
					onClick={onRestartOnboarding}
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
