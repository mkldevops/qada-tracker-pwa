import { useTranslation } from 'react-i18next';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { DebtEvolutionChart } from '@/components/DebtEvolutionChart';
import { StatsChart } from '@/components/StatsChart';
import { PRAYER_CONFIG } from '@/constants/prayers';
import { formatCatchUpLabel, formatDays } from '@/lib/formatDays';
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
			style={{ background: '#242426', border: '1px solid #3A3A3C' }}
		>
			<span className="text-3xl font-semibold tabular-nums" style={{ color: color ?? '#F5F5F0' }}>
				{value}
			</span>
			<span className="text-[10px] font-medium" style={{ color: '#6E6E70' }}>
				{label}
			</span>
		</div>
	);
}

export function Stats() {
	const { t } = useTranslation();
	const stats = useStats();
	const debts = useDebts();
	const totalRemaining = useTotalRemaining();

	const doneLabel = formatCatchUpLabel(stats.allTime, t);

	return (
		<div className="space-y-5 px-7 pb-4 pt-1">
			<h1 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
				{t('stats.title')}
			</h1>

			<div
				className="flex w-full flex-col justify-center gap-2 rounded-[20px] px-6 py-7"
				style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)' }}
			>
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#1A1A1C88' }}>
					{t('stats.totalLogged')}
				</p>
				<p
					className="text-[52px] font-light leading-[0.85] tabular-nums"
					style={{ color: '#1A1A1C' }}
				>
					{stats.allTime.toLocaleString()}
				</p>
				{doneLabel && (
					<p className="text-sm" style={{ color: '#1A1A1C88' }}>
						{doneLabel}
					</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-3">
				<StatTile label={t('stats.today')} value={stats.today} />
				<StatTile
					label={t('stats.streak')}
					value={`${stats.streak}${t('common.dayShort')}`}
					color="#C9A962"
				/>
				<StatTile label={t('stats.thisWeek')} value={stats.thisWeek} />
				<StatTile
					label={t('stats.avgPerDay')}
					value={stats.avgPerDay > 0 ? stats.avgPerDay.toFixed(1) : '—'}
					color="#6E9E6E"
				/>
			</div>

			{stats.estimatedDays && (
				<div
					className="flex items-center justify-between rounded-[20px] px-6"
					style={{ background: '#242426', border: '1px solid #3A3A3C80', height: 72 }}
				>
					<span className="text-[13px] font-medium" style={{ color: '#6E6E70' }}>
						{t('stats.estimation')}
					</span>
					<span className="text-3xl font-semibold tabular-nums" style={{ color: '#C9A962' }}>
						{formatDays(stats.estimatedDays!, t)}
					</span>
				</div>
			)}

			<StatsChart />

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					{t('stats.activity')}
				</p>
				<div
					className="rounded-[20px] p-4"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					<ActivityCalendar />
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					{t('stats.debtEvolution')}
				</p>
				<div
					className="rounded-[20px] p-4"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					<DebtEvolutionChart />
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					{t('stats.debtByPrayer')}
				</p>
				<div
					className="overflow-hidden rounded-[20px]"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
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
								{i > 0 && <div style={{ height: 1, background: '#2A2A2C' }} />}
								<div className="flex flex-col gap-1.5 px-5 py-3">
									<div className="flex items-center justify-between">
										<span
											className="font-display text-[15px] font-medium"
											style={{ color: cfg.hex }}
										>
											{cfg.labelFr}
										</span>
										<span className="text-[11px]" style={{ color: '#6E6E70' }}>
											{(debt?.remaining ?? 0).toLocaleString()} /{' '}
											{(debt?.total_owed ?? 0).toLocaleString()}
										</span>
									</div>
									<div
										className="h-[3px] w-full overflow-hidden rounded-full"
										style={{ background: '#3A3A3C' }}
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
					style={{ background: '#242426', border: '1px solid #3A3A3C', height: 60 }}
				>
					<span className="text-[13px] font-medium" style={{ color: '#6E6E70' }}>
						{t('stats.totalRemaining')}
					</span>
					<span className="text-2xl font-semibold tabular-nums" style={{ color: '#F5F5F0' }}>
						{totalRemaining.toLocaleString()}
					</span>
				</div>
			</div>
		</div>
	);
}
