import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { spring, springSnappy } from '@/lib/animations';
import { formatDays } from '@/lib/formatDays';
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

interface ObjectiveCardProps {
	period: Period;
	onPeriodChange: (period: Period) => void;
	target: string;
	onTargetChange: (value: string) => void;
	totalRemaining: number;
	inputId?: string;
}

export function ObjectiveCard({
	period,
	onPeriodChange,
	target,
	onTargetChange,
	totalRemaining,
	inputId = 'obj-target',
}: ObjectiveCardProps) {
	const { t } = useTranslation();

	const suggestion = useMemo(() => {
		if (totalRemaining === 0) return null;
		const raw =
			period === 'daily'
				? totalRemaining / (365 * 5)
				: period === 'weekly'
					? totalRemaining / (52 * 5)
					: totalRemaining / (12 * 5);
		return Math.max(1, Math.round(raw));
	}, [totalRemaining, period]);

	const parsedTarget = parseInt(target, 10);
	const effectiveTarget = !Number.isNaN(parsedTarget) && parsedTarget > 0 ? parsedTarget : null;

	const estimation = useMemo(() => {
		if (!effectiveTarget || totalRemaining === 0) return null;
		const totalPeriods = Math.ceil(totalRemaining / effectiveTarget);
		const totalDays =
			period === 'daily'
				? totalPeriods
				: period === 'weekly'
					? totalPeriods * 7
					: totalPeriods * 30;
		return formatDays(totalDays, t);
	}, [effectiveTarget, totalRemaining, period, t]);

	const periods: { value: Period; label: string }[] = [
		{ value: 'daily', label: t('common.day_cap') },
		{ value: 'weekly', label: t('common.week_cap') },
		{ value: 'monthly', label: t('common.month_cap') },
	];

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

			<div className="flex flex-col gap-1.5">
				<div className="flex items-center justify-between">
					<label htmlFor={inputId} className="text-xs font-medium text-muted">
						{t('onboarding.targetPer', {
							period: t(
								`common.${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}`,
							),
						})}
					</label>
					<AnimatePresence>
						{suggestion && (
							<motion.button
								type="button"
								onClick={() => onTargetChange(String(suggestion))}
								className="text-[11px] font-medium text-gold"
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
					id={inputId}
					type="number"
					value={target}
					onChange={(e) => onTargetChange(e.target.value)}
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
