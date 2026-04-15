import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppTab } from './AppTab';
import { DebtTab } from './DebtTab';
import { SessionTab } from './SessionTab';

type Tab = 'debt' | 'session' | 'app';
const SETTINGS_TAB_ORDER: Tab[] = ['debt', 'session', 'app'];

const settingsSlideVariants = {
	initial: (dir: number) => ({ x: dir * 100 + '%', opacity: 0 }),
	animate: { x: 0, opacity: 1 },
	exit: (dir: number) => ({ x: dir * -100 + '%', opacity: 0 }),
};

const settingsSlideTransition = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const };

export function Settings({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<Tab>('debt');
	const settingsDirRef = useRef(0);

	function handleSettingsTabChange(tab: Tab) {
		if (tab === activeTab) return;
		settingsDirRef.current =
			SETTINGS_TAB_ORDER.indexOf(tab) > SETTINGS_TAB_ORDER.indexOf(activeTab) ? 1 : -1;
		setActiveTab(tab);
	}

	const TABS: { value: Tab; label: string }[] = [
		{ value: 'debt', label: t('settings.tabDebt') },
		{ value: 'session', label: t('settings.tabSession') },
		{ value: 'app', label: t('settings.tabApp') },
	];

	return (
		<div className="flex flex-col gap-5 px-7 pb-4 pt-1">
			<h1 className="font-display text-3xl font-normal text-foreground">{t('settings.title')}</h1>

			<div className="flex gap-1 rounded-[20px] p-1 bg-background border border-border">
				{TABS.map(({ value, label }) => (
					<button
						key={value}
						type="button"
						onClick={() => handleSettingsTabChange(value)}
						className={`flex-1 rounded-[16px] py-2.5 text-[11px] font-semibold tracking-[1.5px] transition-colors ${activeTab === value ? 'bg-gold text-background' : 'text-tertiary'}`}
					>
						{label}
					</button>
				))}
			</div>

			<AnimatePresence mode="wait" initial={false} custom={settingsDirRef.current}>
				<motion.div
					key={activeTab}
					custom={settingsDirRef.current}
					variants={settingsSlideVariants}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={settingsSlideTransition}
					className="flex flex-col gap-5 overflow-hidden"
				>
					{activeTab === 'debt' && <DebtTab onRestartOnboarding={onRestartOnboarding} />}
					{activeTab === 'session' && <SessionTab />}
					{activeTab === 'app' && <AppTab onRestartOnboarding={onRestartOnboarding} />}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
