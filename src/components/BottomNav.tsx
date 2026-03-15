import { BarChart2, BookOpen, House, Settings } from 'lucide-react';

type Tab = 'dashboard' | 'log' | 'stats' | 'settings';

interface BottomNavProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

const TABS = [
	{ id: 'dashboard' as Tab, icon: House, label: 'ACCUEIL' },
	{ id: 'log' as Tab, icon: BookOpen, label: 'LOGGER' },
	{ id: 'stats' as Tab, icon: BarChart2, label: 'STATS' },
	{ id: 'settings' as Tab, icon: Settings, label: 'RÉGLAGES' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-5 pb-safe pt-3 pb-5">
			<div
				className="flex w-full max-w-lg rounded-[34px] p-1"
				style={{ background: '#242426', border: '1px solid #3A3A3C' }}
			>
				{TABS.map(({ id, icon: Icon, label }) => {
					const active = activeTab === id;
					return (
						<button
							key={id}
							type="button"
							onClick={() => onTabChange(id)}
							className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[26px] py-2.5 transition-colors"
							style={active ? { background: '#C9A962' } : {}}
						>
							<Icon size={18} strokeWidth={1.5} style={{ color: active ? '#1A1A1C' : '#4A4A4C' }} />
							<span
								className="text-[10px] tracking-[0.5px]"
								style={{
									color: active ? '#1A1A1C' : '#4A4A4C',
									fontWeight: active ? 600 : 500,
								}}
							>
								{label}
							</span>
						</button>
					);
				})}
			</div>
		</nav>
	);
}
