export const PWA_INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';

export interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function shouldShowInstallBanner(): boolean {
	// Don't show if already dismissed
	if (localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === 'true') {
		return false;
	}

	// Don't show if already installed (standalone mode)
	if (window.matchMedia('(display-mode: standalone)').matches) {
		return false;
	}

	return true;
}

export function dismissInstallBanner(): void {
	localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, 'true');
}
