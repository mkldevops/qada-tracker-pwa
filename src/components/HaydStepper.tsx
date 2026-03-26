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
				whileTap={{ scale: 0.88 }}
				onClick={() => onChange(Math.max(min, value - 1))}
				disabled={value <= min}
				className="flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold disabled:opacity-30"
				style={{ background: '#2A2A2C', color: '#F5F5F0' }}
			>
				−
			</motion.button>
			<span
				className="w-6 text-center text-lg font-semibold tabular-nums"
				style={{ color: '#F5F5F0' }}
			>
				{value}
			</span>
			<motion.button
				type="button"
				whileTap={{ scale: 0.88 }}
				onClick={() => onChange(Math.min(max, value + 1))}
				disabled={value >= max}
				className="flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold disabled:opacity-30"
				style={{ background: '#2A2A2C', color: '#F5F5F0' }}
			>
				+
			</motion.button>
		</div>
	);
}
