import { motion } from 'motion/react';

interface Props {
	value: number;
	onChange: (n: number) => void;
	min?: number;
	max?: number;
}

export function HaydStepper({ value, onChange, min = 1, max = 15 }: Props) {
	return (
		<div className="flex items-center gap-3">
			<motion.button
				type="button"
				aria-label="−"
				whileTap={{ scale: 0.88 }}
				onClick={() => onChange(Math.max(min, value - 1))}
				disabled={value <= min}
				className="bg-surface-raised text-foreground flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold disabled:opacity-30"
			>
				−
			</motion.button>
			<span className="text-foreground w-6 text-center text-lg font-semibold tabular-nums">
				{value}
			</span>
			<motion.button
				type="button"
				aria-label="+"
				whileTap={{ scale: 0.88 }}
				onClick={() => onChange(Math.min(max, value + 1))}
				disabled={value >= max}
				className="bg-surface-raised text-foreground flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold disabled:opacity-30"
			>
				+
			</motion.button>
		</div>
	);
}
