import { motion } from 'motion/react';

interface UpdateBannerProps {
	onUpdate: () => void;
	onDismiss: () => void;
}

export function UpdateBanner({ onUpdate, onDismiss }: UpdateBannerProps) {
	return (
		<motion.div
			className="fixed bottom-[4.5rem] left-0 right-0 z-40 mx-auto max-w-lg px-4 pb-2"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ type: 'spring', stiffness: 400, damping: 30 }}
		>
			<div
				className="flex items-center justify-between rounded-2xl px-5 py-4"
				style={{
					background: '#242426',
					border: '1px solid #3A3A3C',
					color: '#F5F5F0',
				}}
			>
				<div className="flex flex-1 flex-col gap-1">
					<span className="text-sm font-semibold">Mise à jour disponible</span>
					<span className="text-xs" style={{ color: '#6E6E70' }}>
						v{__APP_VERSION__} est prête
					</span>
				</div>
				<div className="ml-4 flex gap-2">
					<button
						type="button"
						onClick={onUpdate}
						className="whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition-opacity"
						style={{
							background: 'linear-gradient(135deg, #C9A962, #8B7845)',
							color: '#1A1A1C',
						}}
					>
						Mettre à jour
					</button>
					<button
						type="button"
						onClick={onDismiss}
						className="rounded-2xl px-4 py-2 text-sm font-medium transition-opacity"
						style={{
							background: '#3A3A3C',
							color: '#F5F5F0',
						}}
					>
						Plus tard
					</button>
				</div>
			</div>
		</motion.div>
	);
}
