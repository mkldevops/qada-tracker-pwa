import { Home, BookOpen, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'dashboard' | 'log' | 'stats' | 'settings';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS = [
  { id: 'dashboard' as Tab, icon: Home, label: 'Accueil' },
  { id: 'log' as Tab, icon: BookOpen, label: 'Logger' },
  { id: 'stats' as Tab, icon: BarChart2, label: 'Stats' },
  { id: 'settings' as Tab, icon: Settings, label: 'Réglages' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe">
      <div className="flex">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
              activeTab === id ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
