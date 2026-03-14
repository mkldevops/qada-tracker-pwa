import { Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Objective, StatsState } from '@/types';

interface ObjectiveTrackerProps {
  objective: Objective;
  stats: StatsState;
}

const PERIOD_LABEL: Record<string, string> = {
  daily: 'aujourd\'hui',
  weekly: 'cette semaine',
  monthly: 'ce mois',
};

const PERIOD_VALUE = (stats: StatsState, period: string): number => {
  if (period === 'daily') return stats.today;
  if (period === 'weekly') return stats.thisWeek;
  return stats.thisMonth;
};

export function ObjectiveTracker({ objective, stats }: ObjectiveTrackerProps) {
  const current = PERIOD_VALUE(stats, objective.period);
  const progress = objective.target > 0 ? Math.min(100, (current / objective.target) * 100) : 0;
  const done = current >= objective.target;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-primary" />
            <span className="text-sm font-medium">Objectif {PERIOD_LABEL[objective.period]}</span>
          </div>
          <Badge variant={done ? 'default' : 'secondary'}>
            {current} / {objective.target}
          </Badge>
        </div>
        <Progress value={progress} className="mt-3 h-2" />
        {done && (
          <p className="mt-2 text-center text-xs font-medium text-primary">
            Objectif atteint ! 🎉
          </p>
        )}
      </CardContent>
    </Card>
  );
}
