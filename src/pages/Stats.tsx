import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { DebtEvolutionChart } from '@/components/DebtEvolutionChart';
import { EstimationCard } from '@/components/EstimationCard';
import { StatsChart } from '@/components/StatsChart';
import { getPrayerLabel, PRAYER_CONFIG } from '@/constants/prayers';
import { formatCatchUpLabel } from '@/lib/formatDays';
import { useDebts, useStats, useTotalRemaining } from '@/stores/prayerStore';
import { PRAYER_NAMES } from '@/types';

function StatTile({
	label,
	value,
	color,
}: {
	label: string;
	value: string | number;
	color?: string;
}) {
	return (
		<div
			className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-5"
			style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
		>
			<span
				className="text-3xl font-semibold tabular-nums"
				style={{ color: color ?? 'var(--text-primary)' }}
			>
				{value}
			</span>
			<span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
				{label}
			</span>
		</div>
	);
}

export function Stats() {
	const { t, i18n } = useTranslation();
	const stats = useStats();
	const debts = useDebts();
	const totalRemaining = useTotalRemaining();

	const doneLabel = formatCatchUpLabel(stats.allTime, t);
	const totalOwed = Object.values(debts).reduce((sum, d) => sum + (d?.total_owed ?? 0), 0);
	const progress = totalOwed > 0 ? Math.min(100, (stats.allTime / totalOwed) * 100) : 0;

	return (
		<div className="space-y-5 px-7 pb-4 pt-1">
			<h1 className="font-display text-3xl font-normal" style={{ color: 'var(--text-primary)' }}>
				{t('stats.title')}
			</h1>

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
				<StatTile label={t('stats.today')} value={stats.today} />
				<StatTile
					label={t('stats.streak')}
					value={`${stats.streak}${t('common.dayShort')}`}
					color="var(--gold)"
				/>
				<StatTile label={t('stats.thisWeek')} value={stats.thisWeek} />
				<StatTile
					label={t('stats.avgPerDay')}
					value={stats.avgPerDay > 0 ? stats.avgPerDay.toFixed(1) : '—'}
					color="var(--sage)"
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
				<p
					className="text-[11px] font-medium tracking-[3px]"
					style={{ color: 'var(--text-tertiary)' }}
				>
					{t('stats.activity')}
				</p>
				<div
					className="rounded-[20px] p-4"
					style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
				>
					<ActivityCalendar />
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<p
					className="text-[11px] font-medium tracking-[3px]"
					style={{ color: 'var(--text-tertiary)' }}
				>
					{t('stats.debtEvolution')}
				</p>
				<div
					className="rounded-[20px] p-4"
					style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
				>
					<DebtEvolutionChart />
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<p
					className="text-[11px] font-medium tracking-[3px]"
					style={{ color: 'var(--text-tertiary)' }}
				>
					{t('stats.debtByPrayer')}
				</p>
				<div
					className="overflow-hidden rounded-[20px]"
					style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
				>
					{PRAYER_NAMES.map((prayer, i) => {
						const debt = debts[prayer];
						const cfg = PRAYER_CONFIG[prayer];
						const progress =
							debt?.total_owed > 0
								? Math.min(100, (debt.total_completed / debt.total_owed) * 100)
								: 0;
						return (
							<div key={prayer}>
								{i > 0 && <div style={{ height: 1, background: 'var(--border-divider)' }} />}
								<div className="flex flex-col gap-1.5 px-5 py-3">
									<div className="flex items-center justify-between">
										<span
											className="font-display text-[15px] font-medium"
											style={{ color: cfg.hex }}
										>
											{getPrayerLabel(cfg, i18n.language)}
										</span>
										<span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
											{(debt?.remaining ?? 0).toLocaleString()} /{' '}
											{(debt?.total_owed ?? 0).toLocaleString()}
										</span>
									</div>
									<div
										className="h-[3px] w-full overflow-hidden rounded-full"
										style={{ background: 'var(--border)' }}
									>
										<div
											className="h-full rounded-full"
											style={{ width: `${progress}%`, background: cfg.hex }}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div
					className="flex items-center justify-between rounded-[20px] px-6"
					style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 60 }}
				>
					<span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
						{t('stats.totalRemaining')}
					</span>
					<span
						className="text-2xl font-semibold tabular-nums"
						style={{ color: 'var(--text-primary)' }}
					>
						{totalRemaining.toLocaleString()}
					</span>
				</div>
			</div>
		</div>
	);
}
