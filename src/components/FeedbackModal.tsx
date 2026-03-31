import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

// Replace TALLY_FORM_ID with your form ID from https://tally.so/embed/XXXXXX
const TALLY_FORM_ID = 'EkDK5X';

interface FeedbackModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
	const { t, i18n } = useTranslation();

	if (!isOpen) return null;

	const src = `https://tally.so/embed/${TALLY_FORM_ID}?transparentBackground=1&version=${__APP_VERSION__}&lang=${i18n.language}`;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/60"
			onClick={onClose}
		>
			<motion.div
				initial={{ y: '100%' }}
				animate={{ y: 0 }}
				exit={{ y: '100%' }}
				transition={{ type: 'spring', damping: 30, stiffness: 300 }}
				className="flex flex-col rounded-t-[24px] bg-surface pb-safe"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-5 py-4">
					<span className="text-sm font-semibold tracking-[1px] text-foreground">
						{t('settings.sendFeedback')}
					</span>
					<button type="button" onClick={onClose} className="text-muted">
						<X size={20} />
					</button>
				</div>
				<iframe
					src={src}
					title={t('settings.sendFeedback')}
					width="100%"
					height="500"
					frameBorder="0"
					className="border-0"
				/>
			</motion.div>
		</motion.div>
	);
}
