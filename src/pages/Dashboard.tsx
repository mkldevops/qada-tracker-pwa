import { Plus } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Session } from '@/components/Session';
import { PRAYER_CONFIG } from '@/constants/prayers';
import { useDebts, usePrayerStore, useStats, useTotalRemaining } from '@/stores/prayerStore';
import type { PrayerName } from '@/types';
import { PRAYER_NAMES } from '@/types';

function StatPill({
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
			className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-4"
			style={{ background: '#242426', border: '1px solid #3A3A3C' }}
		>
			<span
				className="text-3xl font-semibold leading-none tabular-nums"
				style={{ color: color ?? '#F5F5F0' }}
			>
				{value}
			</span>
			<span className="text-[10px] font-medium" style={{ color: '#6E6E70' }}>
				{label}
			</span>
		</div>
	);
}

function PrayerRow({
	prayer,
	remaining,
	totalOwed,
	totalCompleted,
	onLog,
}: {
	prayer: PrayerName;
	remaining: number;
	totalOwed: number;
	totalCompleted: number;
	onLog: (p: PrayerName) => void;
}) {
	const cfg = PRAYER_CONFIG[prayer];
	const progress = totalOwed > 0 ? Math.min(100, (totalCompleted / totalOwed) * 100) : 0;
	const done = remaining === 0;

	return (
		<div
			className="flex items-center gap-4 rounded-2xl px-5"
			style={{ background: '#242426', border: '1px solid #3A3A3C', height: 72 }}
		>
			<div className="flex flex-1 flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<span className="font-display text-lg font-medium" style={{ color: cfg.hex }}>
						{cfg.labelFr}
					</span>
					<span className="text-xs" style={{ color: '#4A4A4C' }}>
						{cfg.labelAr}
					</span>
					<span className="text-[11px]" style={{ color: '#6E6E70' }}>
						{remaining.toLocaleString()} restantes
					</span>
				</div>
				<div
					className="h-[3px] w-full overflow-hidden rounded-full"
					style={{ background: '#3A3A3C' }}
				>
					<div
						className="h-full rounded-full transition-all"
						style={{ width: `${progress}%`, background: cfg.hex }}
					/>
				</div>
			</div>
			<button
				type="button"
				onClick={() => onLog(prayer)}
				disabled={done}
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-30"
				style={done ? { background: '#2A2A2C' } : { background: '#C9A962' }}
			>
				<Plus size={18} style={{ color: done ? '#6E6E70' : '#1A1A1C' }} />
			</button>
		</div>
	);
}

export function Dashboard() {
	const { logPrayer } = usePrayerStore();
	const debts = useDebts();
	const stats = useStats();
	const totalRemaining = useTotalRemaining();
	const [showSession, setShowSession] = useState(false);

	return (
		<>
			<div className="space-y-5 px-7 pb-4 pt-1">
				<div className="flex items-start justify-between">
					<div className="flex flex-col gap-0.5">
						<h1 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>
							قضاء
						</h1>
						<p className="text-xs font-medium tracking-[1px]" style={{ color: '#6E6E70' }}>
							PRIÈRES À RATTRAPER
						</p>
					</div>
				</div>

				<div
					className="flex w-full flex-col justify-center gap-2 rounded-[20px] px-6 py-7"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)' }}
				>
					<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#1A1A1C99' }}>
						TOTAL RESTANT
					</p>
					<p
						className="text-[64px] font-light leading-[0.85] tabular-nums"
						style={{ color: '#1A1A1C' }}
					>
						{totalRemaining.toLocaleString()}
					</p>
					<p className="text-sm" style={{ color: '#1A1A1C88' }}>
						prières manquées
					</p>
				</div>

				<button
					type="button"
					onClick={() => setShowSession(true)}
					disabled={totalRemaining === 0}
					className="w-full rounded-[28px] py-4 font-semibold tracking-[1.5px] transition-opacity disabled:opacity-30"
					style={{ background: '#242426', border: '1px solid #C9A962', color: '#C9A962' }}
				>
					Lancer une session
				</button>

				<div className="flex gap-3">
					<StatPill label="aujourd'hui" value={stats.today} color="#C9A962" />
					<StatPill label="série" value={`${stats.streak}j`} color="#6E9E6E" />
					<StatPill
						label="estimation"
						value={stats.estimatedDays ? `${stats.estimatedDays}j` : '—'}
					/>
				</div>

				<div className="flex flex-col gap-2.5">
					<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
						PRIÈRES
					</p>
					{PRAYER_NAMES.map((prayer) => (
						<PrayerRow
							key={prayer}
							prayer={prayer}
							remaining={debts[prayer]?.remaining ?? 0}
							totalOwed={debts[prayer]?.total_owed ?? 0}
							totalCompleted={debts[prayer]?.total_completed ?? 0}
							onLog={logPrayer}
						/>
					))}
				</div>
			</div>

			<AnimatePresence>
				{showSession && <Session onClose={() => setShowSession(false)} />}
			</AnimatePresence>
		</>
	);
}
