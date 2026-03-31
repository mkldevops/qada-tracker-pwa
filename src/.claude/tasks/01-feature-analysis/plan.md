# Implementation Plan: Features Impact Fort

## Overview

3 features indépendantes, implémentables dans l'ordre suivant (chacune = 1 PR) :

1. **Milestones** — le plus rapide, impact émotionnel immédiat
2. **Courbe d'évolution de la dette** — extension naturelle de Stats, moteur de motivation
3. **Notifications / rappel quotidien** — rétention long terme, PWA-natif

---

## Feature A — Milestones / Célébrations

Objectif : Détecter quand `stats.allTime` franchit un seuil (100, 500, 1000, 2500, 5000, 10000) et afficher une célébration.

### `src/stores/prayerStore.ts`

- Ajouter constante `MILESTONES = [100, 500, 1000, 2500, 5000, 10000]`
- Ajouter champ `pendingMilestone: number | null` dans l'interface `PrayerStore` (init à `null`)
- Ajouter action `clearMilestone()` qui remet `pendingMilestone` à null
- Après `logPrayer()` et `logBatch()`, une fois `refresh()` terminé, appeler un helper `checkMilestone(allTime)` :
  - Trouver le plus grand milestone ≤ allTime
  - Lire localStorage `celebrated-milestone-{N}` — si absent, setter `pendingMilestone = N` et écrire la clé
- Pattern à suivre : même structure que `setSessionOrder()` pour la persistence localStorage

### `src/components/MilestoneModal.tsx` *(nouveau)*

- Modal overlay fullscreen semi-transparent (background `#1A1A1C99`)
- Centre : chiffre animé en grand (motion/react `scale` + `opacity` spring), message d'encouragement i18n, bouton fermer
- Entrée : `AnimatePresence` + `motion.div` avec spring (suivre pattern de `Session.tsx` completion phase)
- Reçoit props : `milestone: number | null`, `onClose: () => void`
- Si `milestone` null → ne rien rendre (géré par AnimatePresence)

### `src/App.tsx`

- Importer `usePrayerStore` pour récupérer `pendingMilestone` et `clearMilestone`
- Monter `<MilestoneModal>` au niveau racine (hors BottomNav), au-dessus de tout
- Pattern : même emplacement que `<InstallBanner>` et `<UpdateBanner>`

### `src/locales/fr.json` + `src/locales/en.json`

- Ajouter section `milestone` :
  - `milestone.title` : "Félicitations !"
  - `milestone.subtitle` : "{{count}} prières rattrapées"
  - `milestone.message_100` / `_500` / `_1000` etc. : messages contextuels différents par palier (optionnel, sinon message générique)
  - `milestone.close` : "Continuer"

### Tests

- `src/stores/prayerStore.test.ts` : tester que `pendingMilestone` est setté après log qui franchit un seuil, et qu'il n'est pas redemandé si localStorage déjà présent

---

## Feature B — Courbe d'évolution de la dette

Objectif : Afficher une courbe décroissante de `total_remaining` au fil du temps dans la page Stats.

### `src/db/queries.ts`

- Ajouter `getDebtEvolution(db: QadaDB, days: number): Promise<{date: string, remaining: number}[]>`
- Algorithme :
  1. Calculer `currentRemaining` = somme de `(total_owed - total_completed)` pour toutes les prières (réutiliser `getAllDebts`)
  2. Récupérer tous les `prayer_logs` où `logged_at >= dateLimit` (aujourd'hui - days) triés par `logged_at` DESC
  3. Grouper par date ISO (YYYY-MM-DD) → `Map<string, number>` (date → quantity totale)
  4. Reconstruire en marchant backward depuis aujourd'hui : `remaining_at_day = currentRemaining + sum(logs après ce jour)`
  5. Retourner tableau `[{date, remaining}]` trié par date ASC
- Pattern à suivre : `getStats()` dans le même fichier pour la structure des queries Dexie

### `src/components/DebtEvolutionChart.tsx` *(nouveau)*

- Composant autonome avec son propre state de période (7j, 30j, 3m, 6m, 12m)
- Fetch data via `getDebtEvolution(db, days)` dans un `useEffect` sur changement de période
- Rendu SVG inline (suivre pattern de `StatsChart.tsx`) : ligne plutôt que barres
  - Path SVG calculé à partir des points normalisés
  - Gradient fill sous la courbe (`#6E9E6E` → transparent) pour emphase de la baisse
  - Axe Y : valeurs min/max avec labels
  - Axe X : dates avec espacement proportionnel
- Tooltip au hover (même pattern que `StatsChart.tsx` avec état `hoveredIndex`)
- Empty state si aucun log (message i18n)
- Pas de résumé numérique en header — la courbe parle d'elle-même

### `src/pages/Stats.tsx`

- Importer `DebtEvolutionChart`
- Ajouter une section "ÉVOLUTION DE LA DETTE" sous les stat tiles existants
- Utiliser le même style de card que `StatsChart` (background `#242426`, border `#3A3A3C`)
- Ajouter label section `t('stats.debtEvolution')` en texte [11px] tracking [3px] (pattern identique aux autres sections)

### `src/locales/fr.json` + `src/locales/en.json`

- `stats.debtEvolution` : "ÉVOLUTION DE LA DETTE" / "DEBT EVOLUTION"
- `stats.debtEvolutionEmpty` : "Pas encore de données" / "No data yet"
- Réutiliser `common.year`, `common.monthCount` pour les labels d'axe

### Tests

- `src/db/queries.test.ts` : tester `getDebtEvolution` avec fixtures connues (logs sur 3 jours, vérifier que remaining reconstruit correctement)

---

## Feature C — Notifications / Rappel quotidien

Objectif : Permettre à l'utilisateur de configurer un rappel quotidien à une heure donnée. Le rappel se déclenche quand l'app est ouverte si l'heure configurée est dépassée et que le rappel n'a pas encore été envoyé aujourd'hui.

> **Limitation connue** : Sans serveur backend, les notifications push natives (background) ne sont pas possibles. Le rappel se déclenche donc à l'ouverture de l'app — comportement identique à la majorité des tracker apps offline-first.

### `src/hooks/useNotifications.ts` *(nouveau)*

- Exporter hook `useNotifications()` retournant : `{ permission, isEnabled, reminderTime, enable(time), disable(), checkAndNotify() }`
- `permission` : état courant (`Notification.permission`)
- `enable(time: string)` : appeler `Notification.requestPermission()`, si accordé écrire `{enabled: true, time, lastShown: null}` dans localStorage `qada-reminder`
- `disable()` : écrire `{enabled: false}` dans localStorage
- `checkAndNotify()` : si `enabled && permission === 'granted'` et heure actuelle ≥ `time` et `lastShown !== today` → `new Notification('Qada Tracker', {body: ..., icon: '/icon-192.png'})`, écrire `lastShown = today`
- Appeler `checkAndNotify()` au mount du hook

### `src/App.tsx`

- Monter `useNotifications()` au niveau App pour que `checkAndNotify()` s'exécute à chaque ouverture
- (le hook est léger, pas de re-render)

### `src/pages/Settings.tsx`

- Dans l'onglet App, ajouter une nouvelle `CollapsibleSection` label `t('settings.notifications')` avec `defaultOpen={true}` (cohérent avec les autres sections)
- Contenu : toggle on/off + input time (type="time") quand activé
- Si permission refusée → afficher message explicatif avec lien vers les paramètres navigateur
- Brancher sur `useNotifications().enable()` / `.disable()`
- Pattern : même style toggle que le switch "female" dans Settings

### `src/locales/fr.json` + `src/locales/en.json`

- `settings.notifications` : "RAPPEL QUOTIDIEN" / "DAILY REMINDER"
- `settings.notificationsDesc` : "Recevoir un rappel pour faire votre session" / "Get a reminder to complete your session"
- `settings.notificationsTime` : "Heure du rappel" / "Reminder time"
- `settings.notificationsPermissionDenied` : "Notifications bloquées dans les paramètres du navigateur" / "Notifications blocked in browser settings"
- `notifications.body` : "N'oubliez pas votre session de qada aujourd'hui 🤲" / "Don't forget your qada session today 🤲"

### Tests

- `src/hooks/useNotifications.test.ts` : tester que `checkAndNotify` ne re-déclenche pas le même jour, respecte l'heure configurée

---

## Rollout

| Feature | PR | Effort estimé | Dépendances |
|---------|-----|--------------|-------------|
| A — Milestones | feat/milestones | ~2h | aucune |
| B — Courbe dette | feat/debt-evolution-chart | ~3h | aucune |
| C — Notifications | feat/daily-reminder-notifications | ~2h | aucune |

Chaque feature est **indépendante** et peut être livrée dans n'importe quel ordre.
