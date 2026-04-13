import { motion } from 'motion/react';
import { spring } from '@/lib/animations';

export function StatCard({
	label,
	value,
	color,
	index = 0,
}: {
	label: string;
	value: string | number;
	color?: string;
	index?: number;
}) {
	return (
		<motion.div
			className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-surface border border-border py-4"
			initial={{ opacity: 0, scale: 0.85, y: 12 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ delay: 0.14 + index * 0.05, ...spring }}
			whileHover={{ scale: 1.03 }}
		>
			<span
				className={`text-3xl font-semibold leading-none tabular-nums ${!color ? 'text-foreground' : ''}`}
				style={color ? { color } : undefined}
			>
				{value}
			</span>
			<span className="text-[10px] font-medium text-muted">{label}</span>
		</motion.div>
	);
}
