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
		version: '1.22.0',
		date: '2026-03-31',
		changes: {
			fr: [
				'SEO : schémas JSON-LD FAQ, Organization et agrégation des avis pour une meilleure indexation par les IA',
				"Communauté : section pour partager l'app et donner son avis",
				'robots.txt : accès autorisé pour GPTBot, PerplexityBot, ClaudeBot et autres crawlers IA',
			],
			en: [
				'SEO: FAQ, Organization and AggregateRating JSON-LD schemas for better AI indexing',
				'Community: section to share the app and give feedback',
				'robots.txt: allowed access for GPTBot, PerplexityBot, ClaudeBot and other AI crawlers',
			],
		},
	},
	{
		version: '1.21.2',
		date: '2026-03-31',
		changes: {
			fr: [
				'Analytics : suivi des sessions (d\u00e9marrage, fin, abandon) avec dur\u00e9e et nombre de rak\u2019ats',
				'Analytics : suivi de l\u2019export, de l\u2019import et de la r\u00e9initialisation des donn\u00e9es',
				'Analytics : suivi de la consultation du changelog et du red\u00e9marrage de l\u2019onboarding',
			],
			en: [
				'Analytics: session tracking (start, complete, quit) with duration and rak\u2019a count',
				'Analytics: export, import and data reset tracking',
				'Analytics: changelog view and onboarding restart tracking',
			],
		},
	},
	{
		version: '1.21.1',
		date: '2026-03-31',
		changes: {
			fr: [
				'International : les messages d\u2019encouragement sont maintenant traduits en fran\u00e7ais et anglais',
				'Historique : suppression d\u2019une entr\u00e9e avec un long appui (450ms) et une feuille modale',
				'Responsive : disposition am\u00e9lior\u00e9e sur l\u2019\u00e9cran de lancement de session pour les petits \u00e9crans',
				'PWA : mode portrait verrouill\u00e9 en position primaire (sans rotation)',
				'PWA : mise en cache des polices Google avec une dur\u00e9e de 365 jours',
				'App Badge : affichage du nombre total de pri\u00e8res restantes sur l\u2019ic\u00f4ne de l\u2019application',
				'Code : refactorisation des helper de synchronisation dans le store pour r\u00e9duire la duplication',
			],
			en: [
				'i18n: encouragement messages are now translated to French and English',
				'History: delete an entry with a long press (450ms) and modal sheet',
				'Responsive: improved layout on the session setup screen for small screens',
				'PWA: portrait mode locked to primary orientation (no rotation)',
				'PWA: cached Google Fonts with 365-day duration',
				'App Badge: display total remaining prayers on the application icon',
				'Code: refactored sync helpers in the store to reduce duplication',
			],
		},
	},
	{
		version: '1.21.0',
		date: '2026-03-29',
		changes: {
			fr: [
				'Historique : la dur\u00e9e des sessions affiche maintenant les minutes et les secondes',
			],
			en: ['History: session duration now displays minutes and seconds'],
		},
	},
	{
		version: '1.20.0',
		date: '2026-03-29',
		changes: {
			fr: [
				'Correction : le message d\u2019encouragement n\u2019est plus tronqué en bas de l\u2019écran de session',
				'Correction : espacement réduit en haut de l\u2019écran de lancement de session',
				'Session : suppression des boutons de pr\u00e9s\u00e9lection rapide (5, 10, 15, 20)',
				'Correction : le d\u00e9filement du s\u00e9lecteur de nombre ne fait plus scroller la page',
				'Correction : marge ajout\u00e9e entre le s\u00e9lecteur de nombre et le bouton D\u00e9marrer',
			],
			en: [
				'Fix: encouragement message no longer clipped at the bottom of the session setup screen',
				'Fix: reduced top padding on the session setup screen',
				'Session: removed quick-select preset buttons (5, 10, 15, 20)',
				'Fix: scrolling the number picker no longer causes the page to scroll',
				'Fix: added margin between the number picker and the Start button',
			],
		},
	},
	{
		version: '1.19.0',
		date: '2026-03-29',
		changes: {
			fr: [
				'Notification de mise \u00e0 jour : un toast s\u2019affiche avec le num\u00e9ro de version apr\u00e8s chaque mise \u00e0 jour de l\u2019application',
			],
			en: ['Update notification: a toast appears with the version number after each app update'],
		},
	},
	{
		version: '1.18.0',
		date: '2026-03-29',
		changes: {
			fr: [
				'Accueil : écran vide avec bouton de reconfiguration lorsque toutes les prières sont à jour',
				'Correction : la PWA iOS ne colle plus en haut \u2014 prise en compte du safe-area-inset-top',
				'Correction : le message d\u2019encouragement dans la session n\u2019est plus masqué par la barre de navigation',
			],
			en: [
				'Dashboard: zero state with reconfigure button when all prayers are caught up',
				'Fix: iOS PWA content no longer overlaps the status bar (safe-area-inset-top)',
				'Fix: session setup encouragement message is no longer hidden behind the bottom nav',
			],
		},
	},
	{
		version: '1.17.0',
		date: '2026-03-29',
		changes: {
			fr: [
				'Onboarding : carousel de rappels islamiques sur l\u2019étape objectif (rotation toutes les 7 s)',
				'Messages d\u2019encouragement islamiques affichés à la fin de l\u2019onboarding, au démarrage et à la fin d\u2019une session',
				'Session : affichage agrandi des rak\u2019a restantes, décompte en temps réel à chaque rak\u2019a accomplie',
				'Onboarding : saisie de l\u2019objectif convertie en sélecteur +/- avec conversion automatique jour/semaine/mois',
				'Réglages : le sélecteur d\u2019objectif affiche la valeur actuelle par défaut, avec conversion automatique entre périodes',
				'Session : correction du décompte des rak\u2019a restantes ; le sélecteur ne revient plus à 0 après avoir appliqué l\u2019objectif ; affichage du temps estimé en or avec icône',
				'Accueil : écran vide avec bouton de reconfiguration lorsque toutes les prières sont à jour',
				'Correction : la PWA iOS ne colle plus en haut — prise en compte du safe-area-inset-top',
			],
			en: [
				'Onboarding: Islamic reminder carousel on the objective step (rotates every 7 s)',
				'Islamic encouragement messages shown at the end of onboarding, session start, and session completion',
				'Session: enlarged remaining rak\u2019a display, real-time countdown per completed rak\u2019a',
				'Onboarding: objective input replaced with +/- stepper with automatic day/week/month conversion',
				'Settings: objective stepper now defaults to the current value, with automatic period conversion',
				'Session: fix off-by-one in rakat remaining countdown; stepper no longer resets to 0 after applying objective; timer display styled with gold icon',
				'Dashboard: show a zero state with reconfigure button when all prayers are caught up',
				'Fix: iOS PWA safe-area-inset-top — content no longer overlaps the status bar',
			],
		},
	},
	{
		version: '1.16.0',
		date: '2026-03-28',
		changes: {
			fr: ["Réglages : répartir l'objectif journalier sur 2 à 5 sessions par jour"],
			en: ['Settings: split the daily objective across 2 to 5 sessions per day'],
		},
	},
	{
		version: '1.15.4',
		date: '2026-03-27',
		changes: {
			fr: [
				'Session : estimation de la durée affichée à côté de chaque preset et du sélecteur personnalisé',
			],
			en: ['Session: estimated completion time shown next to each preset and the custom picker'],
		},
	},
	{
		version: '1.15.3',
		date: '2026-03-27',
		changes: {
			fr: [
				"Refactoring interne : calcul de suggestion d'objectif mutualisé entre l'onboarding et les réglages",
			],
			en: ['Internal refactor: shared suggestion calculation between onboarding and settings'],
		},
	},
	{
		version: '1.15.2',
		date: '2026-03-27',
		changes: {
			fr: [
				'Onboarding : remplacement des couleurs hexadécimales codées en dur par les tokens du système de design',
			],
			en: ['Onboarding: replace hardcoded hex colors with design system tokens'],
		},
	},
	{
		version: '1.15.1',
		date: '2026-03-27',
		changes: {
			fr: [
				"Réglages > Session : ajout d'indicateurs de focus visibles sur les toggles (accessibilité clavier)",
			],
			en: [
				'Settings > Session: add focus-visible indicators on toggle switches (keyboard accessibility)',
			],
		},
	},
	{
		version: '1.15.0',
		date: '2026-03-27',
		changes: {
			fr: [
				'Réglages > Session : augmentation des zones tactiles des toggles à 44px minimum (accessibilité)',
			],
			en: ['Settings > Session: increase toggle touch targets to 44px minimum (accessibility)'],
		},
	},
	{
		version: '1.14.1',
		date: '2026-03-27',
		changes: {
			fr: [
				'Réglages > Dette : refonte de la section objectif avec stepper animé, suggestion et estimation en direct',
			],
			en: [
				'Settings > Debt: redesign objective section with animated stepper, suggestion and live estimation',
			],
		},
	},
	{
		version: '1.14.0',
		date: '2026-03-27',
		changes: {
			fr: ["Session : correction du bouton FERMER bloqué sur l'écran de fin de session"],
			en: ['Session: fix CLOSE button unresponsive on completion screen'],
		},
	},
	{
		version: '1.13.3',
		date: '2026-03-27',
		changes: {
			fr: [
				'Réglages > Session : nouveau toggle « Suivi sujoud » (désactivé par défaut) — les permissions capteur/caméra ne sont plus demandées si la fonctionnalité est désactivée',
			],
			en: [
				'Settings > Session: new "Sujood tracking" toggle (off by default) — sensor/camera permissions are no longer requested if the feature is disabled',
			],
		},
	},
	{
		version: '1.23.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Accueil : remplacement de toutes les couleurs hexadécimales codées en dur par les tokens du système de design',
			],
			en: ['Home: replaced all hardcoded hex colors with design system tokens'],
		},
	},
	{
		version: '1.22.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Accueil : carte « Série » supprimée, EstimationCard redessinée (valeur + rythme), disposition today 1/3 + estimation 2/3',
				"Objectif : affiche {aujourd'hui} / {cible} dans la carte du jour si un objectif est défini",
			],
			en: [
				'Home: streak card removed, EstimationCard redesigned (value + rate), today 1/3 + estimation 2/3 layout',
				'Objective: shows {today} / {target} in the today card when an objective is set',
			],
		},
	},
	{
		version: '1.21.0',
		date: '2026-03-26',
		changes: {
			fr: ["Logger : l'onglet Historique s'affiche en premier par défaut"],
			en: ['Logger: History tab is shown by default on open'],
		},
	},
	{
		version: '1.20.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Refactoring : constante spring partagée extraite dans src/lib/animations.ts — supprime 8 définitions dupliquées',
			],
			en: [
				'Refactor: shared spring animation constant extracted to src/lib/animations.ts — removes 8 duplicate definitions',
			],
		},
	},
	{
		version: '1.19.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Stats : transition de couleur des barres gérée par CSS — suppression de background dans la prop animate de Framer Motion',
			],
			en: [
				'Stats: bar color transition handled by CSS — removed background from Framer Motion animate prop',
			],
		},
	},
	{
		version: '1.18.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Stats : DebtEvolutionChart et StatsChart — couleurs codées en dur remplacées par les tokens du système de design',
			],
			en: [
				'Stats: DebtEvolutionChart and StatsChart — replaced hardcoded hex colors with design system tokens',
			],
		},
	},
	{
		version: '1.17.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Réglages : couleurs codées en dur remplacées par les tokens du système de design (DebtTab, SessionTab, AppTab, CollapsibleSection)',
			],
			en: [
				'Settings: replaced hardcoded hex colors with design system tokens (DebtTab, SessionTab, AppTab, CollapsibleSection)',
			],
		},
	},
	{
		version: '1.16.0',
		date: '2026-03-26',
		changes: {
			fr: [
				"Correction : le compteur de sujouds se réinitialise correctement lors d'une transition manuelle entre prières",
			],
			en: ['Fix: sujood counter now resets correctly on manual prayer transition'],
		},
	},
	{
		version: '1.15.0',
		date: '2026-03-26',
		changes: {
			fr: ['Extraction du sélecteur de jours de menstrues en composant partagé HaydStepper'],
			en: ['Extracted menses days stepper into a shared HaydStepper component'],
		},
	},
	{
		version: '1.14.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Stats : DebtEvolutionChart et StatsChart utilisent désormais les hooks et composants partagés (PeriodSelector, usePersistedPeriod, useOutsideClick)',
			],
			en: [
				'Stats: DebtEvolutionChart and StatsChart now use shared hooks and component (PeriodSelector, usePersistedPeriod, useOutsideClick)',
			],
		},
	},
	{
		version: '1.13.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Réglages : DebtTab, SessionTab et AppTab extraits en sous-composants séparés — meilleure maintenabilité',
			],
			en: [
				'Settings: DebtTab, SessionTab and AppTab extracted as separate sub-components — improved maintainability',
			],
		},
	},
	{
		version: '1.12.0',
		date: '2026-03-26',
		changes: {
			fr: [
				"Navigation : montage différé des onglets — monté au premier accès, gardé en mémoire ensuite (plus d'animations répétitives, plus d'écouteurs fantômes)",
			],
			en: [
				'Navigation: lazy-mount tabs — mounted on first visit, kept alive after (no more repeated animations, no stale background listeners)',
			],
		},
	},
	{
		version: '1.11.0',
		date: '2026-03-26',
		changes: {
			fr: [
				"Stats : la carte d'estimation du temps de rattrapage adopte le style premium du Dashboard (dégradé doré, bordure ambrée, animation d'entrée)",
			],
			en: [
				'Stats: estimation card now matches the Dashboard premium style (golden gradient, amber border, entrance animation)',
			],
		},
	},
	{
		version: '1.10.0',
		date: '2026-03-26',
		changes: {
			fr: [
				'Nouveau composant PeriodSelector animé pour la sélection de périodes temporelles',
				'Nouveau hook usePersistedPeriod : sélection de période persistée en localStorage',
				"Nouveau hook useOutsideClick : détection des clics en dehors d'un élément",
			],
			en: [
				'New animated PeriodSelector component for time period selection',
				'New usePersistedPeriod hook: period selection persisted in localStorage',
				'New useOutsideClick hook: detects clicks outside a given element',
			],
		},
	},
	{
		version: '1.9.1',
		date: '2026-03-26',
		changes: {
			fr: [
				'Correction : le compteur de sujouds se réinitialise correctement lors du passage à la prière suivante',
			],
			en: ['Fix: sujood counter now resets correctly when transitioning to the next prayer'],
		},
	},
	{
		version: '1.9.0',
		date: '2026-03-26',
		changes: {
			fr: [
				"Mises à jour silencieuses : l'app se recharge automatiquement en arrière-plan, sans dialogue d'interruption",
			],
			en: ['Silent updates: app reloads automatically in the background, no more update dialog'],
		},
	},
	{
		version: '1.8.0',
		date: '2026-03-25',
		changes: {
			fr: [
				'Onglet DETTE simplifié : l\'objectif est maintenant en premier, le calcul de dette remplacé par "Reconfigurer l\'onboarding"',
				'"Reconfigurer l\'onboarding" retiré de l\'onglet APP',
			],
			en: [
				'DEBT tab simplified: objective is now first, debt calculator replaced by "Restart onboarding"',
				'"Restart onboarding" removed from APP tab',
			],
		},
	},
	{
		version: '1.7.2',
		date: '2026-03-25',
		changes: {
			fr: [
				"Décompte de la session en cours : prières et rak'ats restants sur la session (pas la dette globale)",
			],
			en: [
				"Session progress counter now shows remaining prayers and rak'ats for the current session (not global debt)",
			],
		},
	},
	{
		version: '1.6.1',
		date: '2026-03-25',
		changes: {
			fr: ['Remplacement du terme « hayd » par « menstrues » pour plus de clarté'],
			en: ["Replaced 'hayd' with 'menses' for clearer terminology"],
		},
	},
	{
		version: '1.6.0',
		date: '2026-03-25',
		changes: {
			fr: ['Saisie des années manquées remplacée par deux sélecteurs séparés : Années et Mois'],
			en: ['Missed years input replaced with two separate steppers: Years and Months'],
		},
	},
	{
		version: '1.5.0',
		date: '2026-03-25',
		changes: {
			fr: [
				"Décompte des prières restantes et rak'ats affiché pendant la session en cours",
				'Sélecteur hayd (jours/mois) remplacé par un bouton +/− plus facile à utiliser sur mobile',
				'Suggestion de goal revue à la baisse pour rester réaliste (horizon 5 ans)',
			],
			en: [
				"Remaining prayers and rak'ats count shown during the active session",
				'Hayd days input replaced with a +/− stepper, easier to use on mobile',
				'Goal suggestion lowered for a more realistic target (5-year horizon)',
			],
		},
	},
	{
		version: '1.4.1',
		date: '2026-03-25',
		changes: {
			fr: [
				"Correction du scroll bloqué sur l'onboarding mobile (bouton SUIVANT/TERMINER inaccessible)",
				'Activation du toggle Femme ne bloque plus le défilement vers la validation',
			],
			en: [
				'Fix scroll blocked on mobile onboarding (NEXT/FINISH button unreachable)',
				'Enabling the Female toggle no longer prevents scrolling to validation',
			],
		},
	},
	{
		version: '1.3.0',
		date: '2026-03-22',
		changes: {
			fr: [
				"Animation de retour visuel lors du log rapide d'une prière (flash coloré)",
				'Compteur de prières restantes animé à chaque log',
				"Burst d'animation sur le bouton + quand une prière atteint zéro",
				'Respect du paramètre "Réduire les animations" du système',
			],
			en: [
				'Visual flash feedback when quick-logging a prayer',
				'Animated remaining counter on each log',
				'Burst animation on + button when a prayer reaches zero',
				'Respects system "Reduce Motion" accessibility setting',
			],
		},
	},
	{
		version: '1.0.19',
		date: '2026-03-21',
		changes: {
			fr: [
				'Détecteur de sujoud basé sur la luminosité de la caméra frontale (style appel téléphonique)',
				'Basculement automatique vers gyroscope ou bouton manuel si caméra indisponible',
			],
			en: [
				'Sujood detector using front camera brightness (phone-call style)',
				'Automatic fallback to gyroscope or manual button when camera unavailable',
			],
		},
	},
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
