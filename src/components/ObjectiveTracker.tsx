import { Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Objective, StatsState } from '@/types';

interface ObjectiveTrackerProps {
	objective: Objective;
	stats: StatsState;
}

const PERIOD_VALUE = (stats: StatsState, period: string): number => {
	if (period === 'daily') return stats.today;
	if (period === 'weekly') return stats.thisWeek;
	return stats.thisMonth;
};

export function ObjectiveTracker({ objective, stats }: ObjectiveTrackerProps) {
	const { t } = useTranslation();
	const current = PERIOD_VALUE(stats, objective.period);
	const progress = objective.target > 0 ? Math.min(100, (current / objective.target) * 100) : 0;
	const done = current >= objective.target;
	const periodLabel = t(`objective.periodLabel_${objective.period}`);

	return (
		<Card className="border-border bg-card">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Target size={16} className="text-primary" />
						<span className="text-sm font-medium">
							{t('objective.title', { period: periodLabel })}
						</span>
					</div>
					<Badge variant={done ? 'default' : 'secondary'}>
						{current} / {objective.target}
					</Badge>
				</div>
				<Progress value={progress} className="mt-3 h-2" />
				{done && (
					<p className="mt-2 text-center text-xs font-medium text-primary">
						{t('objective.achieved')}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
