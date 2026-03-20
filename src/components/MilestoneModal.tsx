import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface MilestoneModalProps {
	milestone: number | null;
	onClose: () => void;
}

export function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
	const { t } = useTranslation();

	return (
		<AnimatePresence>
			{milestone !== null && (
				<motion.div
					key="milestone-overlay"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-50 flex items-center justify-center"
					style={{ background: 'rgba(26, 26, 28, 0.9)' }}
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.8, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 400, damping: 30 }}
						className="rounded-[24px] px-10 py-10 flex flex-col items-center gap-4 max-w-[320px]"
						style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)' }}
						onClick={(e) => e.stopPropagation()}
					>
						<motion.div
							initial={{ scale: 0, rotate: -20 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }}
							className="text-6xl"
						>
							✨
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.4 }}
							className="text-7xl font-semibold"
							style={{ color: '#1A1A1C' }}
						>
							{milestone}
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.4 }}
							className="text-center"
						>
							<p className="text-base" style={{ color: '#1A1A1C' }}>
								{t('milestone.subtitle', { count: milestone })}
							</p>
							<p className="text-sm mt-2 font-medium" style={{ color: 'rgba(26, 26, 28, 0.8)' }}>
								{t('milestone.title')}
							</p>
						</motion.div>

						<motion.button
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.4 }}
							onClick={onClose}
							className="mt-4 rounded-full py-3 px-8 font-semibold tracking-[1px]"
							style={{ background: '#1A1A1C', color: '#C9A962' }}
							whileTap={{ scale: 0.95 }}
							whileHover={{ scale: 1.02 }}
						>
							{t('milestone.close')}
						</motion.button>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
