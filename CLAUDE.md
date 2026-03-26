# Qada Tracker PWA

## Stack

- **Framework**: React 19 + Vite 7 + TypeScript 5.7
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`, no config file)
- **DB**: Dexie 4 (IndexedDB wrapper — offline-first, no server)
- **State**: Zustand 5
- **Animations**: motion/react (framer-motion v12)
- **i18n**: i18next + react-i18next (FR/EN)
- **Icons**: lucide-react
- **UI primitives**: Radix UI (alert-dialog, progress, separator, tabs, slot)
- **PWA**: vite-plugin-pwa + workbox
- **Linter**: Biome 2 (no ESLint, no Prettier)
- **Tests**: Vitest + happy-dom + fake-indexeddb
- **Package manager**: pnpm 10

## Commands

```bash
pnpm install      # install deps
pnpm run dev      # dev server
pnpm run build    # type-check + vite build
pnpm run lint     # check only
pnpm run lint:fix # auto-fix
pnpm run test     # watch mode
pnpm run test:run # single run
pnpm run coverage # coverage report
```

## Architecture

No routing library — tab-based navigation in `App.tsx` with Framer Motion slide transitions.

```
src/
├── components/       # UI components (+ src/components/ui/ for Radix wrappers)
├── db/               # Dexie schema (database.ts) + all queries (queries.ts)
├── hooks/            # Custom React hooks
├── lib/              # Pure utility functions (each has a .test.ts)
├── locales/          # en.json, fr.json
├── pages/            # Dashboard, LogPrayers, Stats, Settings, OnboardingFlow
├── stores/           # Zustand store (prayerStore.ts)
├── types/            # TypeScript interfaces
├── App.tsx           # Tab routing, PWA install, milestone modals
├── i18n.ts           # i18next setup
└── index.css         # Tailwind + CSS variables design system
```

## Design System

Dark-only app. All tokens defined as CSS variables in `src/index.css` under `@layer base :root`,
then mapped to Tailwind tokens via `@theme inline`.

Key tokens:
- `bg-background` / `bg-surface` / `bg-surface-raised` — dark hierarchy
- `text-foreground` / `text-muted` — text levels
- `bg-gold` / `text-gold` — primary accent (#c9a962)
- `bg-sage` — secondary accent (#6e9e6e)
- `bg-danger` / `text-danger` — destructive (#d45f5f)
- `.font-display` — Cormorant Garamond (serif, decorative)
- `.pb-safe` — safe-area-inset-bottom for iOS
- `.gradient-gold` — linear-gradient(135deg, #c9a962, #8b7845)

**Never hardcode colors** — use CSS variable tokens above.
**No light mode** — single dark theme only.
**Portrait-only** — landscape on mobile hides `#root` and shows a rotation message.

## Key Patterns

### Dexie queries
All DB operations live in `src/db/queries.ts`. Never call `db` directly from components — call
through `prayerStore.ts` which calls queries and syncs Zustand state.

### Zustand store
Single store in `src/stores/prayerStore.ts`. State is loaded from IndexedDB on app mount via
`loadAll()`. Mutations call DB queries then reload state.

### i18n
Use `useTranslation()` hook in every component. Never hardcode user-facing strings in JSX.
Translation keys follow the structure in `src/locales/en.json`.

### Testing
Tests use `fake-indexeddb` for IndexedDB mocking (see `src/test/setup.ts`).
Test files co-located with source: `foo.ts` → `foo.test.ts`.

## Deploy

- **Platform**: Coolify (clf.fahari.pro)
- **App UUID**: `hvq34qzm5g0jqdjcp2hdh1vn`
- **URL**: https://qada.fahari.pro
- **Build pack**: Nixpacks (détection automatique pnpm via packageManager)
- **Branch**: `main`
- **Install**: `pnpm install --frozen-lockfile`
- **Build**: `pnpm run build`
- **Start**: `pnpm dlx serve dist -l 80`

### Trigger un deploy

```bash
rtk proxy curl -s -X GET \
  -H "Authorization: Bearer $COOLIFY_TOKEN_CLF" \
  "https://clf.fahari.pro/api/v1/deploy?uuid=hvq34qzm5g0jqdjcp2hdh1vn&force=false"
```
