import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };

interface Period {
	label: string;
	days: number;
}

export function PeriodSelector({
	periods,
	activeDays,
	onSelect,
}: {
	periods: Period[];
	activeDays: number;
	onSelect: (days: number) => void;
}) {
	return (
		<div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
			{periods.map((p) => {
				const active = p.days === activeDays;
				return (
					<motion.button
						key={p.label}
						type="button"
						aria-pressed={active}
						onClick={() => onSelect(p.days)}
						className={cn(
							'shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-semibold tracking-wide',
							active ? 'bg-primary text-primary-foreground' : 'bg-background text-muted',
						)}
						whileTap={{ scale: 0.88 }}
						animate={active ? { scale: 1.04 } : { scale: 1 }}
						transition={spring}
					>
						{p.label}
					</motion.button>
				);
			})}
		</div>
	);
}
