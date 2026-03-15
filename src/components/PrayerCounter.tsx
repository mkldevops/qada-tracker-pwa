import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PRAYER_CONFIG } from '@/constants/prayers';
import type { PrayerDebt, PrayerName } from '@/types';

interface PrayerCounterProps {
	prayer: PrayerName;
	debt: PrayerDebt;
	onLog: (prayer: PrayerName) => void;
}

export function PrayerCounter({ prayer, debt, onLog }: PrayerCounterProps) {
	const config = PRAYER_CONFIG[prayer];
	const progress =
		debt.total_owed > 0 ? Math.min(100, (debt.total_completed / debt.total_owed) * 100) : 0;

	return (
		<Card className="border-border bg-card">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<span className="text-base font-semibold" style={{ color: config.color }}>
								{config.labelFr}
							</span>
							<span className="text-xs text-muted-foreground">{config.labelAr}</span>
						</div>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{debt.remaining.toLocaleString()} restantes
						</p>
						<Progress value={progress} className="mt-2 h-1.5" />
					</div>
					<Button
						size="icon"
						onClick={() => onLog(prayer)}
						disabled={debt.remaining === 0}
						className="ml-4 h-10 w-10 shrink-0"
					>
						<Plus size={20} />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

interface PrayerRowProps {
	prayer: PrayerName;
	quantity: number;
	onChange: (prayer: PrayerName, quantity: number) => void;
}

export function PrayerRow({ prayer, quantity, onChange }: PrayerRowProps) {
	const config = PRAYER_CONFIG[prayer];

	return (
		<div className="flex items-center justify-between py-2">
			<div>
				<span className="font-medium" style={{ color: config.color }}>
					{config.labelFr}
				</span>
				<span className="ml-2 text-xs text-muted-foreground">{config.labelAr}</span>
			</div>
			<div className="flex items-center gap-3">
				<Button
					size="icon"
					variant="outline"
					className="h-8 w-8"
					onClick={() => onChange(prayer, Math.max(0, quantity - 1))}
					disabled={quantity === 0}
				>
					<Minus size={14} />
				</Button>
				<span className="w-6 text-center font-bold tabular-nums">{quantity}</span>
				<Button
					size="icon"
					variant="outline"
					className="h-8 w-8"
					onClick={() => onChange(prayer, quantity + 1)}
				>
					<Plus size={14} />
				</Button>
			</div>
		</div>
	);
}
