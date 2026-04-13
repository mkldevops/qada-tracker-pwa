import { motion } from 'motion/react';
import { spring } from '@/lib/animations';

const TONE_CLASS = {
	gold: 'text-gold',
	sage: 'text-sage',
} as const;

export function StatCard({
	label,
	value,
	tone,
	index = 0,
}: {
	label: string;
	value: string | number;
	tone?: keyof typeof TONE_CLASS;
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
				className={`text-3xl font-semibold leading-none tabular-nums ${tone ? TONE_CLASS[tone] : 'text-foreground'}`}
			>
				{value}
			</span>
			<span className="text-[10px] font-medium text-muted">{label}</span>
		</motion.div>
	);
}
