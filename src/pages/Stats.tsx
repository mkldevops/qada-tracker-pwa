import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { DebtEvolutionChart } from '@/components/DebtEvolutionChart';
import { EstimationCard } from '@/components/EstimationCard';
import { StatCard } from '@/components/StatCard';
import { StatsChart } from '@/components/StatsChart';
import { getPrayerLabel, PRAYER_CONFIG } from '@/constants/prayers';
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

			<div className="grid grid-cols-2 gap-3">
				<StatCard label={t('stats.today')} value={stats.today} index={0} />
				<StatCard
					label={t('stats.streak')}
					value={`${stats.streak}${t('common.dayShort')}`}
					color="var(--gold)"
					index={1}
				/>
				<StatCard label={t('stats.thisWeek')} value={stats.thisWeek} index={2} />
				<StatCard
					label={t('stats.avgPerDay')}
					value={stats.avgPerDay > 0 ? stats.avgPerDay.toFixed(1) : '—'}
					color="var(--sage)"
					index={3}
				/>
			</div>

			<AnimatePresence>
				{stats.estimatedDays !== null && (
					<EstimationCard
						key="estimation"
						estimatedDays={stats.estimatedDays}
						avgPerDay={stats.avgPerDay}
					/>
				)}
			</AnimatePresence>

			<StatsChart />

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px] text-tertiary">
					{t('stats.activity')}
				</p>
				<div className="rounded-[20px] p-4 bg-surface border border-border">
					<ActivityCalendar />
				</div>
			</div>

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
