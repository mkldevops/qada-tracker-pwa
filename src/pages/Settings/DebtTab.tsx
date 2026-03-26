import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { usePrayerStore } from '@/stores/prayerStore';
import type { Period } from '@/types';

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

export function DebtTab({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
	const { t } = useTranslation();
	const { setObjective, activeObjective } = usePrayerStore();
	const [objPeriod, setObjPeriod] = useState<Period>('daily');
	const [objTarget, setObjTarget] = useState('');

	const PERIODS: { value: Period; label: string }[] = [
		{ value: 'daily', label: t('common.day_cap') },
		{ value: 'weekly', label: t('common.week_cap') },
		{ value: 'monthly', label: t('common.month_cap') },
	];

	const handleSetObjective = async () => {
		const target = parseInt(objTarget, 10);
		if (!Number.isNaN(target) && target > 0) {
			await setObjective(objPeriod, target);
			setObjTarget('');
		}
	};

	return (
		<>
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
					<span className="text-xs font-semibold tracking-[1px]" style={{ color: '#C9A962' }}>
						{t('settings.restartOnboarding')}
					</span>
				</button>
			)}
		</>
	);
}
