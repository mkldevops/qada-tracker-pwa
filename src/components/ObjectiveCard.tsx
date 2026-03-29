import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { spring, springSnappy } from '@/lib/animations';
import { calculateSuggestion } from '@/lib/calculateSuggestion';
import { formatDays } from '@/lib/formatDays';
import type { Period } from '@/types';

interface ObjectiveCardProps {
	period: Period;
	onPeriodChange: (period: Period) => void;
	target: number;
	onTargetChange: (value: number) => void;
	totalRemaining: number;
}

export function ObjectiveCard({
	period,
	onPeriodChange,
	target,
	onTargetChange,
	totalRemaining,
}: ObjectiveCardProps) {
	const { t } = useTranslation();

	const suggestion = useMemo(
		() => calculateSuggestion(totalRemaining, period),
		[totalRemaining, period],
	);

	const estimation = useMemo(() => {
		if (!target || totalRemaining === 0) return null;
		const totalPeriods = Math.ceil(totalRemaining / target);
		const totalDays =
			period === 'daily'
				? totalPeriods
				: period === 'weekly'
					? totalPeriods * 7
					: totalPeriods * 30;
		return formatDays(totalDays, t);
	}, [target, totalRemaining, period, t]);

	const periods: { value: Period; label: string }[] = [
		{ value: 'daily', label: t('common.day_cap') },
		{ value: 'weekly', label: t('common.week_cap') },
		{ value: 'monthly', label: t('common.month_cap') },
	];

	const periodLabel = periods.find((p) => p.value === period)?.label ?? '';

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-1.5 rounded-2xl bg-background border border-border p-1">
				{periods.map(({ value, label }) => {
					const active = period === value;
					return (
						<motion.button
							type="button"
							key={value}
							onClick={() => onPeriodChange(value)}
							className="flex-1 rounded-xl py-2 text-[13px] font-semibold"
							animate={{
								background: active ? 'var(--gold)' : 'transparent',
								color: active ? 'var(--background)' : 'var(--text-muted)',
							}}
							transition={springSnappy}
							whileTap={{ scale: 0.96 }}
						>
							{label}
						</motion.button>
					);
				})}
			</div>

			<div
				className="flex flex-col items-center gap-4 rounded-2xl py-6"
				style={{ background: 'var(--background)' }}
			>
				<span
					className="text-[10px] font-semibold tracking-[1.5px] uppercase"
					style={{ color: 'var(--text-secondary)' }}
				>
					{periodLabel}
				</span>
				<motion.span
					key={target}
					className="text-4xl font-semibold tabular-nums"
					style={{ color: 'var(--text-primary)' }}
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={springSnappy}
				>
					{target}
				</motion.span>
				<div className="flex items-center gap-3">
					<motion.button
						type="button"
						aria-label="−"
						whileTap={{ scale: 0.88 }}
						onClick={() => onTargetChange(Math.max(1, target - 1))}
						disabled={target <= 1}
						className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold disabled:opacity-30"
						style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
					>
						−
					</motion.button>
					<motion.button
						type="button"
						aria-label="+"
						whileTap={{ scale: 0.88 }}
						onClick={() => onTargetChange(target + 1)}
						className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold"
						style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
					>
						+
					</motion.button>
				</div>
				<AnimatePresence>
					{suggestion && suggestion !== target && (
						<motion.button
							type="button"
							onClick={() => onTargetChange(suggestion)}
							className="text-[11px] font-medium text-gold"
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 4 }}
							transition={spring}
						>
							{t('onboarding.suggestion', { value: suggestion })}
						</motion.button>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence>
				{estimation && (
					<motion.div
						className="flex items-center justify-between rounded-xl bg-background border border-gold/20 px-4 py-3"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={spring}
					>
						<span className="text-xs text-muted">{t('onboarding.estimationLabel')}</span>
						<motion.span
							key={estimation}
							className="text-sm font-semibold tabular-nums text-gold"
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
	);
}
