import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Dashboard } from '@/pages/Dashboard';
import { LogPrayers } from '@/pages/LogPrayers';
import { Settings } from '@/pages/Settings';
import { Stats } from '@/pages/Stats';
import { usePrayerStore } from '@/stores/prayerStore';

type Tab = 'dashboard' | 'log' | 'stats' | 'settings';

export function App() {
	const [activeTab, setActiveTab] = useState<Tab>('dashboard');
	const { loadAll, isLoading } = usePrayerStore();

	useEffect(() => {
		loadAll();
	}, [loadAll]);

	if (isLoading) {
		return (
			<div className="flex min-h-dvh items-center justify-center" style={{ background: '#1A1A1C' }}>
				<span className="font-display text-2xl font-light" style={{ color: '#C9A962' }}>
					قضاء
				</span>
			</div>
		);
	}

	const pages = {
		dashboard: <Dashboard />,
		log: <LogPrayers />,
		stats: <Stats />,
		settings: <Settings />,
	};

	return (
		<div className="min-h-dvh" style={{ background: '#1A1A1C' }}>
			<main className="mx-auto max-w-lg pt-4 pb-28">{pages[activeTab]}</main>
			<BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
		</div>
	);
}
