import { useStats, useDebts, useTotalRemaining } from '@/stores/prayerStore';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PRAYER_NAMES } from '@/types';
import { PRAYER_CONFIG } from '@/constants/prayers';

export function Stats() {
  const stats = useStats();
  const debts = useDebts();
  const totalRemaining = useTotalRemaining();

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Statistiques</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="Aujourd'hui" value={stats.today} highlight />
        <StatsCard label="Cette semaine" value={stats.thisWeek} />
        <StatsCard label="Ce mois" value={stats.thisMonth} />
        <StatsCard label="Total logué" value={stats.allTime} />
        <StatsCard label="Streak" value={`${stats.streak}j`} sub="jours consécutifs" />
        <StatsCard
          label="Moy. / jour"
          value={stats.avgPerDay > 0 ? stats.avgPerDay.toFixed(1) : '—'}
          sub="sur 30 jours"
        />
      </div>

      {stats.estimatedDays && (
        <Card className="border-primary/30 bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Estimation pour finir</p>
            <p className="mt-1 text-3xl font-bold text-primary">{stats.estimatedDays}</p>
            <p className="text-sm text-muted-foreground">jours au rythme actuel</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dette par prière
        </h2>
        <Card className="border-border bg-card">
          <CardContent className="divide-y divide-border p-0">
            {PRAYER_NAMES.map((prayer) => {
              const debt = debts[prayer];
              const progress =
                debt.total_owed > 0
                  ? Math.min(100, (debt.total_completed / debt.total_owed) * 100)
                  : 0;
              const config = PRAYER_CONFIG[prayer];
              return (
                <div key={prayer} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: config.color }}>
                      {config.labelFr}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {debt.remaining.toLocaleString()} / {debt.total_owed.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={progress} className="mt-1.5 h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total restant</span>
            <span className="text-lg font-bold">{totalRemaining.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
