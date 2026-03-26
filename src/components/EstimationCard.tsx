import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { spring } from '@/lib/animations';
import { formatDays } from '@/lib/formatDays';

export function EstimationCard({
	estimatedDays,
	avgPerDay,
}: {
	estimatedDays: number;
	avgPerDay: number;
}) {
	const { t } = useTranslation();
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.85, y: 12 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ delay: 0.19, ...spring }}
			className="flex flex-[2] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-4"
			style={{ background: '#242426', border: '1px solid #3A3A3C' }}
		>
			<span
				className="text-center text-2xl font-semibold leading-none tabular-nums"
				style={{ color: '#C9A962' }}
			>
				{formatDays(estimatedDays, t)}
			</span>
			<span
				className="text-center text-[9px] font-medium leading-tight"
				style={{ color: '#6E6E70' }}
			>
				{t('dashboard.estimationRate', { rate: avgPerDay.toFixed(1) })}
			</span>
		</motion.div>
	);
}
