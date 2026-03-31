import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { spring } from '@/lib/animations';
import { randomEncouragement } from '@/lib/encouragements';

export function EncouragementMessage() {
	const { i18n } = useTranslation();
	const [message] = useState(() => randomEncouragement(i18n.language));

	return (
		<motion.div
			className="flex flex-col items-center gap-3 w-full"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.35, ...spring }}
		>
			<div className="flex items-center gap-3 w-full">
				<div className="flex-1" style={{ height: 1, background: 'var(--border)' }} />
				<span
					className="font-display text-xs select-none"
					style={{ color: 'var(--gold)', opacity: 0.7, letterSpacing: '0.15em' }}
				>
					&#10022;
				</span>
				<div className="flex-1" style={{ height: 1, background: 'var(--border)' }} />
			</div>
			<p
				className="font-display text-xl italic text-center px-4 leading-relaxed"
				style={{ color: 'var(--text-secondary)' }}
			>
				{message}
			</p>
		</motion.div>
	);
}
