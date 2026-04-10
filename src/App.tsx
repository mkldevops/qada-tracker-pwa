import { useRegisterSW } from 'virtual:pwa-register/react';
import { AnimatePresence } from 'motion/react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from 'sonner';
import { BottomNav } from '@/components/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InstallBanner } from '@/components/InstallBanner';
import { MilestoneModal } from '@/components/MilestoneModal';
import { useNotifications } from '@/hooks/useNotifications';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { isOnboardingDone, markOnboardingDone, markOnboardingUndone } from '@/lib/onboarding';
import { type BeforeInstallPromptEvent, shouldShowInstallBanner } from '@/lib/pwa';
import { usePrayerStore } from '@/stores/prayerStore';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const LogPrayers = lazy(() =>
	import('@/pages/LogPrayers').then((m) => ({ default: m.LogPrayers })),
);
const OnboardingFlow = lazy(() =>
	import('@/pages/OnboardingFlow').then((m) => ({ default: m.OnboardingFlow })),
);
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const Stats = lazy(() => import('@/pages/Stats').then((m) => ({ default: m.Stats })));

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
		document.documentElement.dir = i18n.language.startsWith('ar') ? 'rtl' : 'ltr';
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
		if (localStorage.getItem('pwa_updated')) {
			localStorage.removeItem('pwa_updated');
			toast.success(`v${__APP_VERSION__}`, {
				description: t('app.updateSuccess'),
				duration: 4000,
			});
		}
	}, [t]);

	useEffect(() => {
		if (!needRefresh) return;
		const triggerUpdate = () => {
			localStorage.setItem('pwa_updated', '1');
			updateServiceWorker(true);
		};
		if (document.hidden) {
			triggerUpdate();
			return;
		}
		const handleHide = () => {
			if (document.hidden) triggerUpdate();
		};
		document.addEventListener('visibilitychange', handleHide);
		return () => document.removeEventListener('visibilitychange', handleHide);
	}, [needRefresh, updateServiceWorker]);

	if (isLoading) {
		return (
			<div
				className="flex min-h-dvh items-center justify-center"
				style={{ background: 'var(--background)' }}
			>
				<span className="font-display text-2xl font-light" style={{ color: 'var(--gold)' }}>
					قضاء
				</span>
			</div>
		);
	}

	if (showOnboarding) {
		return (
			<ErrorBoundary>
				<Suspense fallback={null}>
					<OnboardingFlow
						onComplete={() => {
							markOnboardingDone();
							setShowOnboarding(false);
						}}
					/>
				</Suspense>
			</ErrorBoundary>
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
		<div className="min-h-dvh" style={{ background: 'var(--background)' }}>
			<main className="mx-auto max-w-lg pt-safe pb-28 overflow-hidden">
				<ErrorBoundary>
					{(Object.keys(pages) as Tab[]).map(
						(tab) =>
							mountedTabs.has(tab) && (
								<div key={tab} hidden={tab !== activeTab}>
									<Suspense fallback={null}>{pages[tab]}</Suspense>
								</div>
							),
					)}
				</ErrorBoundary>
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
			<Toaster
				position="top-center"
				toastOptions={{
					style: {
						background: 'var(--surface-raised)',
						border: '1px solid var(--border)',
						color: 'var(--text-primary)',
						fontFamily: 'inherit',
					},
				}}
			/>
		</div>
	);
}
