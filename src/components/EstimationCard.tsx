import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { spring } from '@/lib/animations';
import { formatDays } from '@/lib/formatDays';

export function EstimationCard({ estimatedDays }: { estimatedDays: number }) {
	const { t } = useTranslation();
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ delay: 0.22, ...spring }}
			className="flex items-center justify-between rounded-[20px] px-6"
			style={{
				background: 'linear-gradient(135deg, #1E1A12 0%, #242426 70%)',
				border: '1px solid rgba(201, 169, 98, 0.3)',
				minHeight: 88,
			}}
		>
			<span className="text-[13px] font-medium" style={{ color: '#9A9A9C' }}>
				{t('stats.estimation')}
			</span>
			<span
				className="max-w-[60%] text-right text-2xl font-semibold tabular-nums leading-snug"
				style={{ color: '#C9A962' }}
			>
				{formatDays(estimatedDays, t)}
			</span>
		</motion.div>
	);
}
