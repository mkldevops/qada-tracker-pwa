import { useRegisterSW } from 'virtual:pwa-register/react';
import { AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '@/components/BottomNav';
import { InstallBanner } from '@/components/InstallBanner';
import { MilestoneModal } from '@/components/MilestoneModal';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
	const { t } = useTranslation();
	useNotifications(t('settings.notificationsBody'));
	const [activeTab, setActiveTab] = useState<Tab>('dashboard');
	const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [updateError, setUpdateError] = useState<string | null>(null);
	const { loadAll, isLoading, pendingMilestone, clearMilestone } = usePrayerStore();
	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW();
	const { updateAvailable, dismiss: dismissVersionUpdate } = useVersionCheck();

	useEffect(() => {
		loadAll();
	}, [loadAll]);

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

	const handleUpdate = async () => {
		try {
			await updateServiceWorker(true);
		} catch (error) {
			setUpdateError(t('updateBanner.error'));
			console.error('Update failed:', error);
		}
	};

	const pages = {
		dashboard: <Dashboard />,
		log: <LogPrayers />,
		stats: <Stats />,
		settings: <Settings onRestartOnboarding={handleRestartOnboarding} />,
	};

	return (
		<div className="min-h-dvh" style={{ background: '#1A1A1C' }}>
			<main className="mx-auto max-w-lg pt-4 pb-28">{pages[activeTab]}</main>
			<AlertDialog open={!showOnboarding && (needRefresh || updateAvailable)}>
				<AlertDialogContent style={{ background: '#242426', border: '1px solid #3A3A3C' }}>
					<AlertDialogHeader>
						<AlertDialogTitle style={{ color: '#F5F5F0' }}>
							{t('updateBanner.title')}
						</AlertDialogTitle>
						<AlertDialogDescription style={{ color: '#6E6E70' }}>
							{updateError ?? t('updateBanner.subtitle')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							style={{ background: '#2A2A2C', color: '#F5F5F0', border: 'none' }}
							onClick={needRefresh ? () => setNeedRefresh(false) : dismissVersionUpdate}
						>
							{t('updateBanner.later')}
						</AlertDialogCancel>
						<AlertDialogAction
							style={{ background: '#C9A962', color: '#1A1A1C' }}
							onClick={needRefresh ? handleUpdate : () => window.location.reload()}
						>
							{t('updateBanner.update')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AnimatePresence>
				{!showOnboarding && !needRefresh && installPrompt && shouldShowInstallBanner() && (
					<InstallBanner
						key="install-banner"
						prompt={installPrompt}
						onDismiss={() => setInstallPrompt(null)}
					/>
				)}
			</AnimatePresence>
			<MilestoneModal milestone={pendingMilestone} onClose={clearMilestone} />
			<BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
		</div>
	);
}
