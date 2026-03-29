import { useRegisterSW } from 'virtual:pwa-register/react';
import { AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '@/components/BottomNav';
import { InstallBanner } from '@/components/InstallBanner';
import { MilestoneModal } from '@/components/MilestoneModal';
import { useNotifications } from '@/hooks/useNotifications';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { isOnboardingDone, markOnboardingDone, markOnboardingUndone } from '@/lib/onboarding';
import { type BeforeInstallPromptEvent, shouldShowInstallBanner } from '@/lib/pwa';
import { Dashboard } from '@/pages/Dashboard';
import { LogPrayers } from '@/pages/LogPrayers';
import { OnboardingFlow } from '@/pages/OnboardingFlow';
import { Settings } from '@/pages/Settings';
import { Stats } from '@/pages/Stats';
import { usePrayerStore } from '@/stores/prayerStore';

type Tab = 'dashboard' | 'log' | 'stats' | 'settings';

export function App() {
	const { t, i18n } = useTranslation();
	useNotifications(t('settings.notificationsBody'));
	const [activeTab, setActiveTab] = useState<Tab>(() => {
		const param = new URLSearchParams(window.location.search).get('tab');
		if (param === 'log' || param === 'stats' || param === 'settings') return param as Tab;
		return 'dashboard';
	});
	const [mountedTabs, setMountedTabs] = useState<Set<Tab>>(() => new Set([activeTab]));
	function handleTabChange(tab: Tab) {
		if (tab === activeTab) return;
		setMountedTabs((prev) => new Set([...prev, tab]));
		setActiveTab(tab);
	}
	const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const { loadAll, isLoading, pendingMilestone, clearMilestone } = usePrayerStore();
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW();
	useVersionCheck();

	useEffect(() => {
		loadAll();
	}, [loadAll]);

	useEffect(() => {
		const tabLabel = {
			dashboard: t('nav.home'),
			log: t('nav.log'),
			stats: t('nav.stats'),
			settings: t('nav.settings'),
		}[activeTab];
		document.title = `Qada Tracker — ${tabLabel}`;
	}, [activeTab, t]);

	useEffect(() => {
		document.documentElement.lang = i18n.language;
	}, [i18n.language]);

	useEffect(() => {
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setInstallPrompt(e as BeforeInstallPromptEvent);
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		};
	}, []);

	useEffect(() => {
		if (!needRefresh) return;
		if (document.hidden) {
			updateServiceWorker(true);
			return;
		}
		const handleHide = () => {
			if (document.hidden) updateServiceWorker(true);
		};
		document.addEventListener('visibilitychange', handleHide);
		return () => document.removeEventListener('visibilitychange', handleHide);
	}, [needRefresh, updateServiceWorker]);

	if (isLoading) {
		return (
			<div className="flex min-h-dvh items-center justify-center" style={{ background: '#1A1A1C' }}>
				<span className="font-display text-2xl font-light" style={{ color: '#C9A962' }}>
					قضاء
				</span>
			</div>
		);
	}

	if (showOnboarding) {
		return (
			<OnboardingFlow
				onComplete={() => {
					markOnboardingDone();
					setShowOnboarding(false);
				}}
			/>
		);
	}

	function handleRestartOnboarding() {
		markOnboardingUndone();
		setShowOnboarding(true);
	}

	const pages = {
		dashboard: <Dashboard onRestartOnboarding={handleRestartOnboarding} />,
		log: <LogPrayers />,
		stats: <Stats />,
		settings: <Settings onRestartOnboarding={handleRestartOnboarding} />,
	};

	return (
		<div className="min-h-dvh" style={{ background: '#1A1A1C' }}>
			<main className="mx-auto max-w-lg pt-safe pb-28 overflow-hidden">
				{(Object.keys(pages) as Tab[]).map(
					(tab) =>
						mountedTabs.has(tab) && (
							<div key={tab} hidden={tab !== activeTab}>
								{pages[tab]}
							</div>
						),
				)}
			</main>
			<AnimatePresence>
				{!showOnboarding && installPrompt && shouldShowInstallBanner() && (
					<InstallBanner
						key="install-banner"
						prompt={installPrompt}
						onDismiss={() => setInstallPrompt(null)}
					/>
				)}
			</AnimatePresence>
			<MilestoneModal milestone={pendingMilestone} onClose={clearMilestone} />
			<BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
		</div>
	);
}
