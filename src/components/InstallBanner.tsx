import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallBannerProps {
	prompt: BeforeInstallPromptEvent;
	onDismiss: () => void;
}

export function InstallBanner({ prompt, onDismiss }: InstallBannerProps) {
	const [visible, setVisible] = useState(false);
	const [isPrompting, setIsPrompting] = useState(false);

	useEffect(() => {
		// Don't show if already dismissed
		if (localStorage.getItem('pwa-install-dismissed') === 'true') {
			return;
		}

		// Don't show if already installed (standalone mode)
		if (window.matchMedia('(display-mode: standalone)').matches) {
			return;
		}

		// Show banner
		setVisible(true);
	}, []);

	const handleInstall = async () => {
		setIsPrompting(true);
		try {
			await prompt.prompt();
			const { outcome } = await prompt.userChoice;
			if (outcome === 'accepted') {
				// User accepted install
				localStorage.setItem('pwa-install-dismissed', 'true');
				setVisible(false);
				onDismiss();
			} else {
				// User dismissed
				localStorage.setItem('pwa-install-dismissed', 'true');
				setVisible(false);
				onDismiss();
			}
		} catch (error) {
			console.error('Install prompt failed:', error);
		} finally {
			setIsPrompting(false);
		}
	};

	const handleDismiss = () => {
		localStorage.setItem('pwa-install-dismissed', 'true');
		setVisible(false);
		onDismiss();
	};

	if (!visible) return null;

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
