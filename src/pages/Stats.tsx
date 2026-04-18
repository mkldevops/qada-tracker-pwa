import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { DebtEvolutionChart } from '@/components/DebtEvolutionChart';
import { EstimationCard } from '@/components/EstimationCard';
import { StatCard } from '@/components/StatCard';
import { StatsChart } from '@/components/StatsChart';
import { getPrayerLabel, PRAYER_CONFIG } from '@/constants/prayers';
import { spring } from '@/lib/animations';
import { formatCatchUpLabel } from '@/lib/formatDays';
import { calculateProgress } from '@/lib/progress';
import { useDebts, useStats, useTotalRemaining } from '@/stores/prayerStore';
import { PRAYER_NAMES } from '@/types';

export function Stats() {
	const { t, i18n } = useTranslation();
	const stats = useStats();
	const debts = useDebts();
	const totalRemaining = useTotalRemaining();

	const doneLabel = formatCatchUpLabel(stats.allTime, t);
	const totalOwed = Object.values(debts).reduce((sum, d) => sum + (d?.total_owed ?? 0), 0);
	const progress = calculateProgress(stats.allTime, totalOwed);

	const weekDelta = stats.thisWeek - stats.lastWeek;
	const weekBadge =
		stats.lastWeek > 0 && weekDelta !== 0
			? weekDelta > 0
				? `+${weekDelta}`
				: `${weekDelta}`
			: undefined;
	const weekBadgeTone = weekBadge
		? weekDelta > 0
			? ('sage' as const)
			: ('danger' as const)
		: undefined;

	const pace = stats.avgPerDay > 0 ? (stats.avgPerDay * 30) / 150 : 0;

	return (
		<div className="space-y-5 px-7 pb-4 pt-1">
			<h1 className="font-display text-3xl font-normal text-foreground">{t('stats.title')}</h1>

			<div className="gradient-gold flex w-full flex-col justify-center gap-2 rounded-[20px] px-6 py-7">
				<div className="flex items-center justify-between">
					<p
						className="text-[11px] font-medium tracking-[3px]"
						style={{ color: 'color-mix(in srgb, var(--background) 53%, transparent)' }}
					>
						{t('stats.totalLogged')}
					</p>
					{totalOwed > 0 && (
						<p
							className="text-sm font-medium tabular-nums"
							style={{ color: 'color-mix(in srgb, var(--background) 70%, transparent)' }}
						>
							{progress.toFixed(2)}%
						</p>
					)}
				</div>
				<p
					className="text-[52px] font-light leading-[0.85] tabular-nums"
					style={{ color: 'var(--background)' }}
				>
					{stats.allTime.toLocaleString()}
				</p>
				{doneLabel && (
					<p
						className="text-sm"
						style={{ color: 'color-mix(in srgb, var(--background) 53%, transparent)' }}
					>
						{doneLabel}
					</p>
				)}
			</div>

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px] text-tertiary">
					{t('stats.sectionNow')}
				</p>
				<div className="grid grid-cols-2 gap-3">
					<StatCard
						label={t('stats.streak')}
						value={stats.streak > 0 ? `${stats.streak}${t('common.dayShort')}` : '—'}
						tone="gold"
						index={0}
					/>
					<StatCard
						label={t('stats.bestStreak')}
						value={stats.bestStreak > 0 ? `${stats.bestStreak}${t('common.dayShort')}` : '—'}
						tone="sage"
						index={1}
					/>
					<StatCard label={t('stats.today')} value={stats.today} index={2} />
					<StatCard
						label={t('stats.consistency')}
						value={stats.consistencyRate > 0 ? `${stats.consistencyRate}%` : '—'}
						tone="sage"
						index={3}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px] text-tertiary">
					{t('stats.sectionWeek')}
				</p>
				<div className="grid grid-cols-2 gap-3">
					<StatCard
						label={t('stats.thisWeek')}
						value={stats.thisWeek}
						badge={weekBadge}
						badgeTone={weekBadgeTone}
						index={0}
					/>
					<StatCard label={t('stats.lastWeek')} value={stats.lastWeek} index={1} />
					<StatCard
						label={t('stats.bestDay')}
						value={stats.bestDay > 0 ? stats.bestDay : '—'}
						tone="gold"
						index={2}
					/>
					<StatCard
						label={t('stats.bestWeek')}
						value={stats.bestWeek > 0 ? stats.bestWeek : '—'}
						tone="gold"
						index={3}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px] text-tertiary">
					{t('stats.sectionOverview')}
				</p>
				<AnimatePresence>
					{stats.estimatedDays !== null && (
						<EstimationCard
							key="estimation"
							estimatedDays={stats.estimatedDays}
							avgPerDay={stats.avgPerDay}
						/>
					)}
				</AnimatePresence>

				{pace > 0 && (
					<motion.div
						className="flex items-center justify-between rounded-[20px] bg-surface border border-border px-6 py-4"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, ...spring }}
					>
						<span className="text-[12px] font-medium text-muted">{t('stats.paceLabel')}</span>
						<span className="text-2xl font-semibold tabular-nums text-sage">{pace.toFixed(1)}</span>
					</motion.div>
				)}

				{stats.nextMilestone !== null && (
					<motion.div
						className="flex flex-col gap-3 rounded-[20px] bg-surface border border-border px-6 py-4"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.15, ...spring }}
					>
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-medium tracking-[2px] text-tertiary">
								{t('stats.nextMilestoneLabel')}
							</span>
							<span className="text-[12px] font-medium text-muted">
								{t('stats.nextMilestoneTarget', {
									target: stats.nextMilestone.target.toLocaleString(),
								})}
							</span>
						</div>
						<div className="flex items-end gap-2">
							<span className="text-3xl font-semibold tabular-nums text-gold">
								{stats.nextMilestone.remaining.toLocaleString()}
							</span>
							<span className="pb-0.5 text-[12px] font-medium text-muted">
								{t('stats.nextMilestoneUnit')}
							</span>
						</div>
						<div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
							<div
								className="h-full rounded-full bg-gold"
								style={{
									width: `${Math.min(100, (stats.allTime / stats.nextMilestone.target) * 100).toFixed(1)}%`,
								}}
							/>
						</div>
					</motion.div>
				)}
			</div>

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px] text-tertiary">
					{t('stats.activity')}
				</p>
				<div className="rounded-[20px] p-4 bg-surface border border-border">
					<ActivityCalendar />
				</div>
			</div>

			<StatsChart />

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px] text-tertiary">
					{t('stats.debtEvolution')}
				</p>
				<div className="rounded-[20px] p-4 bg-surface border border-border">
					<DebtEvolutionChart />
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px] text-tertiary">
					{t('stats.debtByPrayer')}
				</p>
				<div className="overflow-hidden rounded-[20px] bg-surface border border-border">
					{PRAYER_NAMES.map((prayer, i) => {
						const debt = debts[prayer];
						const cfg = PRAYER_CONFIG[prayer];
						const prayerProgress = calculateProgress(
							debt?.total_completed ?? 0,
							debt?.total_owed ?? 0,
						);
						return (
							<div key={prayer}>
								{i > 0 && <div className="h-px bg-border" />}
								<div className="flex flex-col gap-1.5 px-5 py-3">
									<div className="flex items-center justify-between">
										<span
											className="font-display text-[15px] font-medium"
											style={{ color: cfg.hex }}
										>
											{getPrayerLabel(cfg, i18n.language)}
										</span>
										<span className="text-[11px] text-muted">
											{(debt?.remaining ?? 0).toLocaleString()} /{' '}
											{(debt?.total_owed ?? 0).toLocaleString()}
										</span>
									</div>
									<div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
										<div
											className="h-full rounded-full"
											style={{ width: `${prayerProgress}%`, background: cfg.hex }}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div className="flex h-[60px] items-center justify-between rounded-[20px] px-6 bg-surface border border-border">
					<span className="text-[13px] font-medium text-muted">{t('stats.totalRemaining')}</span>
					<span className="text-2xl font-semibold tabular-nums text-foreground">
						{totalRemaining.toLocaleString()}
					</span>
				</div>
			</div>
		</div>
	);
}
