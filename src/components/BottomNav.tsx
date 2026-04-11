import { BarChart2, BookOpen, House, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Tab = 'dashboard' | 'log' | 'stats' | 'settings';

interface BottomNavProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
	const { t } = useTranslation();

	const TABS = [
		{ id: 'dashboard' as Tab, icon: House, label: t('nav.home') },
		{ id: 'log' as Tab, icon: BookOpen, label: t('nav.log') },
		{ id: 'stats' as Tab, icon: BarChart2, label: t('nav.stats') },
		{ id: 'settings' as Tab, icon: Settings, label: t('nav.settings') },
	];

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-5 pb-safe pt-3 pb-5">
			<div
				className="flex w-full max-w-lg rounded-[34px] p-1"
				style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
			>
				{TABS.map(({ id, icon: Icon, label }) => {
					const active = activeTab === id;
					return (
						<button
							key={id}
							type="button"
							onClick={() => onTabChange(id)}
							className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[26px] py-2.5 transition-colors"
							style={active ? { background: 'var(--gold)' } : {}}
						>
							<Icon
								size={18}
								strokeWidth={1.5}
								style={{ color: active ? 'var(--background)' : 'var(--text-tertiary)' }}
							/>
							<span
								className="text-[10px] tracking-[0.5px]"
								style={{
									color: active ? 'var(--background)' : 'var(--text-tertiary)',
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
