import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { usePrayerStore } from '@/stores/prayerStore';
import type { Period } from '@/types';

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

export function DebtTab({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
	const { t } = useTranslation();
	const { setObjective, activeObjective } = usePrayerStore();
	const [objPeriod, setObjPeriod] = useState<Period>('daily');
	const [objTarget, setObjTarget] = useState('');
	const [error, setError] = useState<string | null>(null);

	const PERIODS: { value: Period; label: string }[] = [
		{ value: 'daily', label: t('common.day_cap') },
		{ value: 'weekly', label: t('common.week_cap') },
		{ value: 'monthly', label: t('common.month_cap') },
	];

	const handleSetObjective = async () => {
		const target = parseInt(objTarget, 10);
		if (!Number.isNaN(target) && target > 0) {
			try {
				await setObjective(objPeriod, target);
				setObjTarget('');
			} catch {
				setError(t('settings.importError'));
			}
		}
	};

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
					<div className="flex gap-2">
						{PERIODS.map(({ value, label }) => (
							<button
								type="button"
								key={value}
								onClick={() => setObjPeriod(value)}
								className={`flex-1 rounded-[20px] py-2.5 text-[13px] font-medium transition-colors ${
									objPeriod === value
										? 'bg-gold text-background font-semibold'
										: 'bg-background border border-border text-tertiary'
								}`}
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
							className="gradient-gold rounded-[22px] px-6 text-[13px] font-bold text-background transition-opacity disabled:opacity-30"
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
