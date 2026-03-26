# Tailwind CSS v4 Rules

## Proactive Behavior

When writing styles, Claude must use the project's CSS variable tokens — never hardcoded hex colors
or Tailwind palette colors (`text-[#c9a962]`, `bg-yellow-500`).

When adding a new color or design token, it goes in `src/index.css` inside `@layer base :root` +
`@theme inline` — no `tailwind.config.ts` (doesn't exist in v4).

---

## Project Design Tokens

All tokens defined in `src/index.css`:

```
bg-background        #1a1a1c    — page background
bg-surface           #242426    — card/panel background
bg-surface-raised    #2a2a2c    — elevated elements, inputs
bg-border / border-border        #3a3a3c    — borders
text-foreground      #f5f5f0    — primary text
text-muted           #6e6e70    — secondary text

bg-gold / text-gold  #c9a962    — primary accent (prayer counts, CTAs)
bg-sage / text-sage  #6e9e6e    — secondary accent
bg-danger / text-danger  #d45f5f — destructive actions

bg-primary = gold (#c9a962)
bg-card = surface (#242426)
bg-destructive = danger (#d45f5f)
```

Custom utilities:
- `.font-display` — Cormorant Garamond serif
- `.pb-safe` — iOS safe-area bottom padding
- `.gradient-gold` — linear-gradient(135deg, #c9a962, #8b7845)

---

## Never Hardcode Colors in JSX

```tsx
// ✅ Correct — uses design token
<div className="bg-surface border border-border text-foreground">
  <span className="text-gold">1 234</span>
</div>

// ❌ Wrong — hardcoded hex
<div className="bg-[#242426] border-[#3a3a3c]">
  <span className="text-[#c9a962]">1 234</span>
</div>

// ❌ Wrong — Tailwind palette color (not in design system)
<div className="bg-zinc-800">
```

---

## Theme Setup (v4 via Vite)

This project uses `@tailwindcss/vite` (no PostCSS config needed):

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
plugins: [react(), tailwindcss()]
```

```css
/* src/index.css */
@import "tailwindcss";

@layer base {
  :root {
    --gold: #c9a962;
    /* ... */
  }
}

@theme inline {
  --color-gold: var(--gold);
  --color-primary: var(--gold);
  /* ... */
}
```

---

## No tailwind.config.ts

Tailwind v4 has no config file. All configuration is in `src/index.css`.

---

## Dark-Only App

No light/dark mode toggle. The app is dark-only — do not add `dark:` variants or conditional
themes. The `:root` values are always active.
