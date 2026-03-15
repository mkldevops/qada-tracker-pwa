# Qada Tracker PWA

## Stack

- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4
- **DB**: Dexie (IndexedDB)
- **State**: Zustand
- **Animations**: motion/react (framer-motion v12)
- **Package manager**: pnpm 10

## Commands

```bash
pnpm install     # install deps
pnpm run build   # type-check + vite build
pnpm run dev     # dev server
```

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
