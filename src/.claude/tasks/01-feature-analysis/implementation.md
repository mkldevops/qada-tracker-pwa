# Implementation: Features Impact Fort

## Completed

### Feature A — Milestones / Célébrations
- `src/stores/prayerStore.ts` — `MILESTONES` constant, `checkMilestone()` helper, `pendingMilestone` state, `clearMilestone()` action, détection post-log dans `logPrayer()` et `logBatch()`
- `src/components/MilestoneModal.tsx` — modal overlay avec AnimatePresence, gradient gold, animations spring séquencées (✨ → chiffre → texte → bouton)
- `src/App.tsx` — `<MilestoneModal>` monté au niveau racine
- `src/locales/fr.json` + `en.json` — section `milestone.*`

### Feature B — Courbe d'évolution de la dette
- `src/db/queries.ts` — `getDebtEvolution(db, days)` : reconstruction historique backward depuis `currentRemaining`
- `src/components/DebtEvolutionChart.tsx` — chart SVG ligne avec gradient fill vert, 5 périodes (7j/30j/3m/6m/12m), hover tooltip, empty state
- `src/pages/Stats.tsx` — section "ÉVOLUTION DE LA DETTE" ajoutée
- `src/locales/fr.json` + `en.json` — `stats.debtEvolution`, `stats.debtEvolutionEmpty`

### Feature C — Notifications / Rappel quotidien
- `src/hooks/useNotifications.ts` — hook complet : permission, enable/disable, updateTime, checkAndNotify (1x/jour, heure configurable), localStorage persistence
- `src/App.tsx` — `useNotifications(t('settings.notificationsBody'))` au mount
- `src/pages/Settings.tsx` — CollapsibleSection "RAPPEL QUOTIDIEN" dans onglet App : toggle + input time + message si permission refusée
- `src/locales/fr.json` + `en.json` — clés `settings.notifications*`

## Deviations from Plan

Aucune déviation significative. Implémentation conforme au plan.

## Test Results

- Build: ✓ (`pnpm run build` — 0 TypeScript errors)
- Lint: non exécuté (hors scope de cette session)
- Tests unitaires: non ajoutés (prévu en follow-up)

## Follow-up Tasks

- [ ] Tests unitaires `prayerStore.test.ts` — milestone detection + localStorage guard
- [ ] Tests unitaires `queries.test.ts` — `getDebtEvolution` avec fixtures
- [ ] Tests unitaires `useNotifications.test.ts` — une seule notification par jour, respect de l'heure
- [ ] PR: ship les 3 features en 1 PR ou 3 PRs séparées selon préférence
