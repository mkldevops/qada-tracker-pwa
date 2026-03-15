import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
	label: string;
	value: string | number;
	sub?: string;
	highlight?: boolean;
}

export function StatsCard({ label, value, sub, highlight }: StatsCardProps) {
	return (
		<Card className={cn('border-border bg-card', highlight && 'border-primary/40')}>
			<CardContent className="p-4">
				<p className="text-xs text-muted-foreground">{label}</p>
				<p
					className={cn('mt-1 text-2xl font-bold', highlight ? 'text-primary' : 'text-foreground')}
				>
					{value}
				</p>
				{sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
			</CardContent>
		</Card>
	);
}
