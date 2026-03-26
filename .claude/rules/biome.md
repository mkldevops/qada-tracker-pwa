# Biome Rules

## Proactive Behavior

This project uses Biome as its linter and formatter. ESLint and Prettier are NOT installed.

When fixing lint/format issues, Claude must use Biome commands — never suggest `eslint`, `eslint --fix`,
or `prettier --write`.

When a pre-commit hook fails due to lint errors, Claude must run `pnpm lint:fix` first, then fix
remaining errors manually.

---

## Correct Commands

```bash
pnpm lint          # Check only (no writes)
pnpm lint:fix      # Auto-fix everything Biome can fix
```

No `pnpm format` or `pnpm typecheck` scripts — type checking is part of `pnpm build` (`tsc -b`).

---

## Suppressing Biome Errors

Use `biome-ignore` — not `eslint-disable`.

```typescript
// ✅ Correct suppression
// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted internal HTML
dangerouslySetInnerHTML={{ __html: sanitizedHtml }}

// biome-ignore lint/suspicious/noExplicitAny: external API has no types
function handleResponse(data: any) { ... }

// ❌ Wrong — eslint-disable has no effect
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

Format: `// biome-ignore lint/<category>/<ruleName>: <reason>`

---

## Pre-commit Hook

Husky runs `lint-staged` on commit, which executes: `biome check --write --no-errors-on-unmatched`

- **Errors** block the commit
- The pre-push hook runs `vitest` — tests must pass before push

If the hook fails:
```bash
pnpm lint 2>&1 | grep "error"
```

---

## Common Rules to Know

| Rule | Default | Meaning |
|------|---------|---------|
| `correctness/noUnusedImports` | error | Remove unused imports |
| `style/useConst` | error | Use `const` when variable not reassigned |
| `style/useImportType` | error | Use `import type` for type-only imports |
| `suspicious/noExplicitAny` | warn | Avoid `any` type |

---

## TypeScript Import Types

Biome enforces `import type` for type-only imports.

```typescript
// ✅ Correct
import type { FC } from "react";

// ❌ Wrong — Biome will flag this
import { FC } from "react"; // if only used as a type
```

---

## Biome Config

Config is in `biome.json`:
- Tab indentation (`indentStyle: "tab"`)
- Line width: 100
- Single quotes in JS, double quotes in JSX
- Trailing commas: all
- Import organization enabled
