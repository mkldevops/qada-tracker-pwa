import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { track } from '@/lib/analytics';
import type { Milestone } from '@/types';

interface MilestoneModalProps {
	milestone: Milestone | null;
	onClose: () => void;
}

const MILESTONE_CONFIG: Record<Milestone['kind'], { emoji: string; isYear: boolean }> = {
	count: { emoji: '✨', isYear: false },
	month: { emoji: '🌙', isYear: false },
	year: { emoji: '🎉', isYear: true },
};

function MilestoneContent({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
	const { t } = useTranslation();
	const { emoji, isYear } = MILESTONE_CONFIG[milestone.kind];

	const value =
		milestone.kind === 'count'
			? milestone.value
			: milestone.kind === 'year'
				? milestone.years
				: milestone.months;
	const trackedRef = useRef('');
	useEffect(() => {
		const key = `${milestone.kind}:${value}`;
		if (trackedRef.current === key) return;
		trackedRef.current = key;
		track({ name: 'milestone_reached', data: { kind: milestone.kind, value } });
	}, [milestone.kind, value]);
	const subtleColor = 'color-mix(in srgb, var(--background) 80%, transparent)';

	let title: string;
	let subtitle: string;
	if (milestone.kind === 'count') {
		title = t('milestone.subtitle', { count: milestone.value });
		subtitle = t('milestone.title');
	} else if (milestone.kind === 'year') {
		title = t('milestone.catchupYear', { count: milestone.years });
		subtitle = t('milestone.catchupEncouragement');
	} else {
		title = t('milestone.catchupMonth', { count: milestone.months });
		subtitle = t('milestone.catchupEncouragement');
	}

	return (
		<motion.div
			key="milestone-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className="fixed inset-0 z-50 flex items-center justify-center bg-background/90"
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.8, opacity: 0 }}
				transition={{ type: 'spring', stiffness: 400, damping: 30 }}
				className="gradient-gold rounded-[24px] px-10 py-10 flex flex-col items-center gap-4 max-w-[320px]"
				onClick={(e) => e.stopPropagation()}
			>
				<motion.div
					initial={{ scale: 0, rotate: -20 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }}
					className={isYear ? 'text-7xl' : 'text-6xl'}
				>
					{emoji}
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.4 }}
					className="text-center"
				>
					<p
						className={isYear ? 'text-3xl font-bold' : 'text-2xl font-semibold'}
						style={{ color: 'var(--background)' }}
					>
						{title}
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.4 }}
					className="text-center"
				>
					<p className="text-sm font-medium" style={{ color: subtleColor }}>
						{subtitle}
					</p>
				</motion.div>

				{isYear && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: [0, 1, 0.6, 1] }}
						transition={{ delay: 0.4, duration: 1.2 }}
						className="text-3xl"
					>
						🌟
					</motion.div>
				)}

				<motion.button
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: isYear ? 0.6 : 0.4, duration: 0.4 }}
					onClick={onClose}
					className="mt-4 rounded-full py-3 px-8 font-semibold tracking-[1px]"
					style={{ background: 'var(--background)', color: 'var(--gold)' }}
					whileTap={{ scale: 0.95 }}
					whileHover={{ scale: 1.02 }}
				>
					{t('milestone.close')}
				</motion.button>
			</motion.div>
		</motion.div>
	);
}

export function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
	return (
		<AnimatePresence>
			{milestone && <MilestoneContent key="milestone" milestone={milestone} onClose={onClose} />}
		</AnimatePresence>
	);
}
