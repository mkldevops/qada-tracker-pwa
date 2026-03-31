# Task: Analyse des features manquantes — Qada Tracker PWA

## Codebase Context

### Features existantes (v1.0.13)

| Zone | Feature |
|------|---------|
| Dashboard | Total restant, catch-up duration, stats aujourd'hui/streak, progress bars par prière, bouton session |
| Log | Logger par prière ± quantité, historique groupé par session, undo |
| Stats | Total logué, streak, moy/jour, chart 7j→12m, dette par prière |
| Settings | Dette par années/manuel, objectif (daily/weekly/monthly), ordre session, export/import JSON, langue, reset |
| Session | Compteur rakaat, capteur proximité + fallback bouton manuel, Wake Lock implicite |
| Onboarding | Welcome → Dette → Objectif → Summary |
| PWA | Installation banner, update banner, service worker |
| i18n | FR / EN |

### Schéma de données (Dexie IndexedDB)

- `prayer_debts` — total_owed, total_completed par prière
- `prayer_logs` — log individuel avec session_id, quantity, logged_at
- `objectives` — period, target, is_active

---

## GitHub Issues (historique)

### Open
- #52 — expand all collapse sections by default *(déjà livré dans PR #54)*

### Closed (shipped)
- Proximité sensor + fallback manuel, estimation, i18n, backup/restore, auto-versioning, stats chart, session order, onboarding skip, Wake Lock, PWA icons, avgPerDay fix...

**→ Aucune issue ouverte pertinente. La backlog est vide.**

---

## Features Manquantes — Analyse Priorisée

### 🔴 Valeur élevée / Effort faible

#### 1. Notifications push (rappel quotidien)
- **Pourquoi** : Core use case — sans rappel, les utilisateurs oublient de logguer. Killer feature pour un tracker.
- **Comment** : Web Push API + service worker (déjà installé). Configurer heure de rappel dans Settings.
- **Files à toucher** : `src/service-worker.ts` (ou vite-pwa config), nouveau composant Settings, nouveau hook `useNotifications`

#### 2. Évolution de la dette dans le temps (chart)
- **Pourquoi** : Le chart actuel montre les prières *faites*, pas la *dette restante* au fil du temps. Voir sa dette baisser est la principale motivation.
- **Comment** : Calculer `total_remaining` à chaque date à partir des logs → courbe descendante
- **Files** : `src/db/queries.ts`, `src/components/StatsChart.tsx`, ou nouveau composant `DebtEvolutionChart`

#### 3. Milestone / célébration (100, 500, 1000 prières)
- **Pourquoi** : Gamification légère. Sentiment d'accomplissement. Peu de code, grand impact émotionnel.
- **Comment** : Vérifier seuils lors de `logPrayer()`, déclencher animation/modal de célébration
- **Files** : `src/stores/prayerStore.ts`, nouveau composant `MilestoneModal`

### 🟡 Valeur élevée / Effort moyen

#### 4. Calendrier / heatmap des jours actifs
- **Pourquoi** : Visualisation de la régularité (comme GitHub contribution graph). Renforce le streak.
- **Comment** : Requête `prayer_logs` groupée par jour sur 3-6 mois → grille colorée
- **Files** : nouveau composant `ActivityCalendar`, `src/db/queries.ts`

#### 5. Historique de sessions détaillé
- **Pourquoi** : L'onglet Log montre les entrées mais pas un résumé "session du 15 mars : 20 prières en 12 min". Utile pour analyser ses habitudes.
- **Comment** : Grouper par `session_id` avec metadata (durée, nb total, prières)
- **Files** : `src/pages/LogPrayers.tsx`, `src/lib/groupBySession.ts`

#### 6. Widget rapide (session en 1 tap depuis l'écran d'accueil)
- **Pourquoi** : Réduire la friction pour lancer une session. Les PWA supportent les shortcuts.
- **Comment** : `shortcuts` dans le manifest PWA + deep link vers `/session`
- **Files** : `vite.config.ts` (vite-plugin-pwa manifest), `src/App.tsx` routing

### 🟢 Valeur moyenne / Effort variable

#### 7. Objectif journalier visible sur le Dashboard
- **Pourquoi** : L'objectif existe en DB mais n'est affiché que brièvement. Un indicateur "12/20 aujourd'hui" sur le dashboard serait motivant.
- **Files** : `src/pages/Dashboard.tsx`, `src/stores/prayerStore.ts`

#### 8. Export/partage de progression (texte/image)
- **Pourquoi** : Les utilisateurs veulent parfois partager leur avancement avec un proche ou un groupe.
- **Comment** : Générer un texte formaté ou canvas → clipboard/share API
- **Files** : nouveau util `src/lib/shareProgress.ts`

#### 9. Sunan rawatib / nafl (prières non-obligatoires)
- **Pourquoi** : Certains utilisateurs trackent aussi les prières sunnah manquées (Witr, Fajr sunnah...).
- **Effort** : Moyen-élevé — implique d'étendre le schéma DB et l'UI

---

## Key Files

- `src/pages/Dashboard.tsx` — point d'entrée principal
- `src/pages/Stats.tsx` — stats et charts
- `src/pages/Settings.tsx` — configuration
- `src/db/queries.ts` — toutes les requêtes DB
- `src/stores/prayerStore.ts` — state global + actions
- `src/components/StatsChart.tsx:1` — chart interactif
- `src/lib/groupBySession.ts` — groupement de logs
- `vite.config.ts` — config PWA (manifest, service worker)

## Patterns à suivre

- Nouvelles pages → `src/pages/`, exportées depuis `src/App.tsx`
- Nouvelles queries DB → `src/db/queries.ts` avec transactions Dexie
- Nouvelles clés i18n → `src/locales/fr.json` + `src/locales/en.json`
- Animations → `motion/react` avec spring physics
- Styles → Tailwind v4 + inline `style={{}}` pour les couleurs thème

## Dependencies disponibles

Tout est déjà installé : motion/react, lucide-react, Dexie, Zustand, i18next, vite-plugin-pwa (service worker), Radix UI.

Pour les notifications push : pas de lib supplémentaire nécessaire (Web Push natif).
