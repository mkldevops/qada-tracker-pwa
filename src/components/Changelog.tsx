import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface ChangelogEntry {
	version: string;
	date: string;
	changes: { fr: string[]; en: string[] };
}

const ENTRIES: ChangelogEntry[] = [
	{
		version: '1.0.18',
		date: '2026-03-20',
		changes: {
			fr: [
				'Détection automatique des sujouds sur Chrome via le gyroscope',
				'Basculement vers bouton manuel si capteur indisponible (desktop, iOS refusé)',
				'Demande de permission gyroscope sur iOS 13+ au démarrage de session',
			],
			en: [
				'Automatic sujood detection on Chrome via gyroscope',
				'Falls back to manual button when sensor unavailable (desktop, iOS denied)',
				'Gyroscope permission requested on iOS 13+ at session start',
			],
		},
	},
	{
		version: '1.0.16',
		date: '2026-03-20',
		changes: {
			fr: [
				"Calendrier d'activité style GitHub (16 semaines)",
				"Détail des sessions dans l'historique (durée, prières)",
				"Raccourcis PWA : Logger et Stats depuis l'écran d'accueil",
			],
			en: [
				'GitHub-style activity calendar (16 weeks)',
				'Session details in history (duration, prayers)',
				'PWA shortcuts: Logger and Stats from home screen',
			],
		},
	},
	{
		version: '1.0.15',
		date: '2026-03-20',
		changes: {
			fr: ["Rappel quotidien déplacé dans l'onglet Session des réglages"],
			en: ['Daily reminder moved to the Session tab in settings'],
		},
	},
	{
		version: '1.0.14',
		date: '2026-03-20',
		changes: {
			fr: [
				'Jalons : animation de célébration toutes les 100 prières',
				"Graphique d'évolution de la dette",
				'Rappel quotidien configurable',
				"Dialogue de mise à jour de l'app",
			],
			en: [
				'Milestones: celebration animation every 100 prayers',
				'Debt evolution chart',
				'Configurable daily reminder',
				'In-app update dialog',
			],
		},
	},
	{
		version: '1.0.13',
		date: '2026-03-20',
		changes: {
			fr: ['Durée de rattrapage estimée sur la carte stats'],
			en: ['Estimated catch-up duration on the stats card'],
		},
	},
	{
		version: '1.0.12',
		date: '2026-03-20',
		changes: {
			fr: [
				'Durée de rattrapage affichée dans le tableau de bord',
				'Sections collapsibles dans les réglages',
			],
			en: ['Catch-up duration shown on the dashboard', 'Collapsible sections in settings'],
		},
	},
	{
		version: '1.0.10',
		date: '2026-03-16',
		changes: {
			fr: ['Bouton manuel pour compter les sujouds si le capteur est indisponible'],
			en: ['Manual button to count sujoods when sensor is unavailable'],
		},
	},
	{
		version: '1.0.8',
		date: '2026-03-16',
		changes: {
			fr: ["Refonte de la tuile d'estimation en carte pleine largeur"],
			en: ['Estimation tile redesigned as full-width card'],
		},
	},
	{
		version: '1.0.6',
		date: '2026-03-16',
		changes: {
			fr: [
				'Vérification de mise à jour automatique',
				'Notification de nouvelle version disponible',
			],
			en: ['Automatic update check', 'Notification for new version available'],
		},
	},
	{
		version: '1.0.5',
		date: '2026-03-16',
		changes: {
			fr: [
				'Réglages réorganisés en onglets (Dette, Session, App)',
				'Sections collapsibles dans les réglages',
			],
			en: [
				'Settings reorganized into tabs (Debt, Session, App)',
				'Collapsible sections in settings',
			],
		},
	},
	{
		version: '1.0.3',
		date: '2026-03-16',
		changes: {
			fr: ['Support multilingue : français et anglais'],
			en: ['Multilingual support: French and English'],
		},
	},
	{
		version: '1.0.1',
		date: '2026-03-16',
		changes: {
			fr: ['Sauvegarde et restauration des données (export/import JSON)'],
			en: ['Data backup and restore (JSON export/import)'],
		},
	},
	{
		version: '1.0.0',
		date: '2026-03-16',
		changes: {
			fr: [
				'Lancement initial',
				'Session de rattrapage avec détection automatique des sujouds',
				'Détection de proximité pour le comptage mains-libres',
				"Maintien de l'écran allumé pendant la session",
				'Paramétrage de la dette et des objectifs',
				'Statistiques et historique',
			],
			en: [
				'Initial release',
				'Catch-up session with automatic sujood detection',
				'Proximity sensor for hands-free counting',
				'Screen wake lock during session',
				'Debt and goal configuration',
				'Statistics and history',
			],
		},
	},
];

interface Props {
	onClose: () => void;
}

export function Changelog({ onClose }: Props) {
	const { i18n, t } = useTranslation();
	const lang = i18n.language.startsWith('fr') ? 'fr' : 'en';

	return (
		<motion.div
			className="fixed inset-0 z-50 flex flex-col"
			style={{ background: '#1A1A1C' }}
			initial={{ x: '100%' }}
			animate={{ x: 0 }}
			exit={{ x: '100%' }}
			transition={{ type: 'spring', stiffness: 300, damping: 30 }}
		>
			{/* Header */}
			<div
				className="flex items-center gap-3 px-4 py-4"
				style={{ borderBottom: '1px solid #2A2A2C' }}
			>
				<button
					type="button"
					onClick={onClose}
					className="flex items-center justify-center rounded-full p-2"
					style={{ background: '#242426' }}
				>
					<ChevronLeft size={20} style={{ color: '#F5F5F0' }} />
				</button>
				<span className="text-base font-semibold tracking-wide" style={{ color: '#F5F5F0' }}>
					{t('settings.changelog')}
				</span>
			</div>

			{/* Entries */}
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="mx-auto flex max-w-lg flex-col gap-4">
					{ENTRIES.map((entry) => (
						<div
							key={entry.version}
							className="rounded-[20px] px-5 py-4"
							style={{ background: '#242426', border: '1px solid #3A3A3C' }}
						>
							<div className="mb-3 flex items-baseline justify-between">
								<span className="text-sm font-bold tracking-wide" style={{ color: '#C9A962' }}>
									v{entry.version}
								</span>
								<span className="text-xs" style={{ color: '#4A4A4C' }}>
									{new Date(`${entry.date}T00:00:00`).toLocaleDateString(i18n.language, {
										day: 'numeric',
										month: 'short',
										year: 'numeric',
									})}
								</span>
							</div>
							<ul className="flex flex-col gap-1.5">
								{entry.changes[lang].map((change) => (
									<li key={change} className="flex items-start gap-2">
										<span
											className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
											style={{ background: '#6E6E70' }}
										/>
										<span className="text-sm leading-relaxed" style={{ color: '#A0A0A4' }}>
											{change}
										</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>
		</motion.div>
	);
}
