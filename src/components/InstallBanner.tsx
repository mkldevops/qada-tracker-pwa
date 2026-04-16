import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { track } from '@/lib/analytics';
import { type BeforeInstallPromptEvent, dismissInstallBanner } from '@/lib/pwa';

interface InstallBannerProps {
	prompt: BeforeInstallPromptEvent;
	onDismiss: () => void;
}

export function InstallBanner({ prompt, onDismiss }: InstallBannerProps) {
	const { t } = useTranslation();
	const [isPrompting, setIsPrompting] = useState(false);

	const handleInstall = async () => {
		setIsPrompting(true);
		try {
			await prompt.prompt();
			await prompt.userChoice;
			track({ name: 'pwa_install' });
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
		track({ name: 'pwa_install_dismiss' });
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
			<div className="rounded-2xl px-5 py-4 flex items-center justify-between bg-surface border border-border text-foreground">
				<div className="flex flex-col gap-1 flex-1">
					<span className="text-sm font-semibold">{t('installBanner.title')}</span>
					<span className="text-xs text-muted">{t('installBanner.subtitle')}</span>
				</div>
				<div className="flex gap-2 ms-4">
					<button
						type="button"
						onClick={handleInstall}
						disabled={isPrompting}
						className="px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap disabled:opacity-50 transition-opacity gradient-gold text-background"
					>
						{isPrompting ? '...' : t('installBanner.install')}
					</button>
					<button
						type="button"
						onClick={handleDismiss}
						disabled={isPrompting}
						className="px-4 py-2 rounded-2xl text-sm font-medium disabled:opacity-50 transition-opacity bg-surface-raised text-foreground"
					>
						{t('installBanner.later')}
					</button>
				</div>
			</div>
		</motion.div>
	);
}
