import { motion } from 'motion/react';
import { useState } from 'react';

interface UpdateBannerProps {
	onUpdate: () => void | Promise<void>;
	onDismiss: () => void;
	error?: string | null;
}

export function UpdateBanner({ onUpdate, onDismiss, error }: UpdateBannerProps) {
	const [isUpdating, setIsUpdating] = useState(false);

	const handleUpdate = async () => {
		setIsUpdating(true);
		try {
			await onUpdate();
		} finally {
			setIsUpdating(false);
		}
	};

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
					{error ? (
						<span className="text-xs" style={{ color: '#D45F5F' }}>
							{error}
						</span>
					) : (
						<span className="text-xs" style={{ color: '#6E6E70' }}>
							Une nouvelle version est prête
						</span>
					)}
				</div>
				<div className="ml-4 flex gap-2">
					<button
						type="button"
						onClick={handleUpdate}
						disabled={isUpdating}
						className="whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
						style={{
							background: 'linear-gradient(135deg, #C9A962, #8B7845)',
							color: '#1A1A1C',
						}}
					>
						{isUpdating ? '...' : 'Mettre à jour'}
					</button>
					<button
						type="button"
						onClick={onDismiss}
						disabled={isUpdating}
						className="rounded-2xl px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
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
