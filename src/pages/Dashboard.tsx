import { usePrayerStore, useDebts, useStats, useTotalRemaining } from '@/stores/prayerStore';
import { PrayerCounter } from '@/components/PrayerCounter';
import { StatsCard } from '@/components/StatsCard';
import { ObjectiveTracker } from '@/components/ObjectiveTracker';
import { PRAYER_NAMES } from '@/types';

export function Dashboard() {
  const { logPrayer, activeObjective } = usePrayerStore();
  const debts = useDebts();
  const stats = useStats();
  const totalRemaining = useTotalRemaining();

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Qada Tracker</h1>
        <p className="text-sm text-muted-foreground">
          {totalRemaining.toLocaleString()} prières restantes
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="Aujourd'hui" value={stats.today} highlight />
        <StatsCard label="Cette semaine" value={stats.thisWeek} />
        <StatsCard label="Streak" value={`${stats.streak}j`} sub="jours consécutifs" />
        <StatsCard
          label="Estimation"
          value={stats.estimatedDays ? `${stats.estimatedDays}j` : '—'}
          sub={stats.estimatedDays ? 'pour finir' : 'pas de données'}
        />
      </div>

      {activeObjective && <ObjectiveTracker objective={activeObjective} stats={stats} />}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Logger une prière
        </h2>
        {PRAYER_NAMES.map((prayer) => (
          <PrayerCounter
            key={prayer}
            prayer={prayer}
            debt={debts[prayer]}
            onLog={logPrayer}
          />
        ))}
      </div>
    </div>
  );
}
