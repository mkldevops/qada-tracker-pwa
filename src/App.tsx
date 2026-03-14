import { useEffect, useState } from 'react';
import { usePrayerStore } from '@/stores/prayerStore';
import { BottomNav } from '@/components/BottomNav';
import { Dashboard } from '@/pages/Dashboard';
import { LogPrayers } from '@/pages/LogPrayers';
import { Stats } from '@/pages/Stats';
import { Settings } from '@/pages/Settings';

type Tab = 'dashboard' | 'log' | 'stats' | 'settings';

const PAGES: Record<Tab, React.ReactNode> = {
  dashboard: <Dashboard />,
  log: <LogPrayers />,
  stats: <Stats />,
  settings: <Settings />,
};

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { loadAll, isLoading } = usePrayerStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20">
      <main className="mx-auto max-w-lg">{PAGES[activeTab]}</main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
