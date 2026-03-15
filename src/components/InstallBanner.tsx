import { motion } from 'motion/react';
import { useState } from 'react';
import { type BeforeInstallPromptEvent, dismissInstallBanner } from '@/lib/pwa';

interface InstallBannerProps {
	prompt: BeforeInstallPromptEvent;
	onDismiss: () => void;
}

export function InstallBanner({ prompt, onDismiss }: InstallBannerProps) {
	const [isPrompting, setIsPrompting] = useState(false);

	const handleInstall = async () => {
		setIsPrompting(true);
		try {
			await prompt.prompt();
			await prompt.userChoice;
			dismissInstallBanner();
			onDismiss();
		} catch (error) {
			console.error('Install prompt failed:', error);
			dismissInstallBanner();
			onDismiss();
		} finally {
			setIsPrompting(false);
		}
	};

	const handleDismiss = () => {
		dismissInstallBanner();
		onDismiss();
	};

	return (
		<motion.div
			className="fixed bottom-[4.5rem] left-0 right-0 z-40 max-w-lg mx-auto px-4 pb-2"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ type: 'spring', stiffness: 400, damping: 30 }}
		>
			<div
				className="rounded-2xl px-5 py-4 flex items-center justify-between"
				style={{
					background: '#242426',
					border: '1px solid #3A3A3C',
					color: '#F5F5F0',
				}}
			>
				<div className="flex flex-col gap-1 flex-1">
					<span className="text-sm font-semibold">Ajouter à l'écran d'accueil</span>
					<span className="text-xs" style={{ color: '#6E6E70' }}>
						Accès rapide à l'app
					</span>
				</div>
				<div className="flex gap-2 ml-4">
					<button
						type="button"
						onClick={handleInstall}
						disabled={isPrompting}
						className="px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap disabled:opacity-50 transition-opacity"
						style={{
							background: 'linear-gradient(135deg, #C9A962, #8B7845)',
							color: '#1A1A1C',
						}}
					>
						{isPrompting ? '...' : 'Installer'}
					</button>
					<button
						type="button"
						onClick={handleDismiss}
						disabled={isPrompting}
						className="px-4 py-2 rounded-2xl text-sm font-medium disabled:opacity-50 transition-opacity"
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
