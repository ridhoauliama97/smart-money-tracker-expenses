<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# smart-money-tracker-expenses

## Stack

- **Framework**: TanStack Start (React 19, TanStack Router, TanStack Query)
- **Runtime**: Bun (`bunfig.toml` — 24h supply-chain guard)
- **UI**: shadcn/ui (new-york style), Radix, Tailwind CSS v4
- **State**: zustand + persist (localStorage key: `money-tracker-v1`)
- **Build**: Vite via `@lovable.dev/vite-tanstack-config` — do **not** add tanstackStart/viteReact/tailwindcss/tsConfigPaths/nitro plugins manually, they're bundled
- **Deploy**: Cloudflare Workers (nitro preset `cloudflare-module`)

## Commands

| Command                            | Action                                |
| ---------------------------------- | ------------------------------------- |
| `bun dev`                          | Dev server                            |
| `bun run build`                    | Production build                      |
| `bun run build:dev`                | Dev-mode build (`--mode development`) |
| `bun run preview`                  | Preview build output                  |
| `bun run lint`                     | ESLint all files (flat config)        |
| `bun run format`                   | Prettier --write all files            |
| `npx wrangler --cwd ./.output dev` | Preview Cloudflare Worker locally     |

## Gotchas

- **No test runner, no typecheck script.** Add one if needed.
- **`noUnusedLocals`/`noUnusedParameters` are `false`** in tsconfig, and `@typescript-eslint/no-unused-vars` is **off** in eslint. Unused vars are completely silent.
- **Zustand `skipHydration: true`** — rehydrate manually in `AppShell` via `useFinance.persist.rehydrate()`. The `_hydrated` flag gates rendering (skeleton until ready).
- **Theme (dark/light/system)** — controlled by `settings.theme` in zustand. A blocking inline script in `RootShell` reads localStorage to prevent flash. `ThemeSync` component handles `matchMedia` listener for system mode and updates `theme-color` meta. Default is `"dark"`.
- **Tailwind v4 source scanning**: `@import "tailwindcss" source(none)` + `@source "../src"` — only `src/` is scanned.
- **CSS is imported as URL**: `import appCss from "../styles.css?url"` in `RootShell` (`<link>`), not as a side-effect import.
- **`routeTree.gen.ts`** is auto-generated (excluded from prettier). Never edit by hand.
- **Budgets always default to "monthly"** — the store supports other periods but no UI exposes them.
- **Locale**: Indonesian (labels, errors, empty states). Default currency: IDR. Month names are Indonesian.
- **UID generation**: `crypto.randomUUID()` with `Math.random().toString(36).slice(2)` fallback.
- **SSR error recovery**: `src/server.ts` intercepts swallowed h3 errors and renders an HTML error page instead of JSON 500.
- **Do NOT import from `server-only`** — ESLint blocks it. Use `.server.ts` suffix instead.
- **`resetAll()`** wipes all data, including custom categories (reverts to 12 defaults).

## Architecture

- **All data is client-only** in localStorage. No backend.
- Entry: `src/start.ts` → `src/router.tsx` → `src/routes/__root.tsx`
- Routes in `src/routes/`, file-based. See `src/routes/README.md` for naming conventions.
- `@/*` path alias → `./src/*`
