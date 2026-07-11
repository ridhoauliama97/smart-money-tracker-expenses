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
- **State**: zustand — `useFinance` (no persist), `useAuth`, `useProfile` (no persist), `useNotifications` (persist: `money-tracker-notifications-v1`), `useTour` (persist: `money-tracker-tour-v1`)
- **Backend**: Supabase (auth, data persistence, real-time sync)
- **Build**: Vite via `@lovable.dev/vite-tanstack-config` — do **not** add tanstackStart/viteReact/tailwindcss/tsConfigPaths/nitro plugins manually, they're bundled
- **Deploy**: Cloudflare Workers (nitro preset `cloudflare-module`)

## Commands

| Command                            | Action                                |
| ---------------------------------- | ------------------------------------- |
| `bun dev`                          | Dev server (runs `gen-version` first) |
| `bun run build`                    | Production build                      |
| `bun run build:dev`                | Dev-mode build (`--mode development`) |
| `bun run preview`                  | Preview build output                  |
| `bun run lint`                     | ESLint all files (flat config)        |
| `bun run format`                   | Prettier --write all files            |
| `npx wrangler --cwd ./.output dev` | Preview Cloudflare Worker locally     |

## Gotchas

- **Supabase is the data backend.** The `useFinance` store calls Supabase REST for all CRUD. localStorage is only used for (a) migrating legacy data from `money-tracker-v1` on first login, and (b) a theme side-channel key `money-tracker-theme`. Notifications and tour stores still use zustand/persist.
- **Auth required.** `AuthGuard` in `AppShell` redirects unauthenticated users to `/login`. `useAuth.initialize()` runs on mount via `supabase.auth.getSession()` + `onAuthStateChange`.
- **Hydration flow**: `AppShell` → `migrateFromLocalStorage()` → `fetchAll()` (loads all Supabase data) → `setHydrated()`. The `_hydrated` flag gates rendering (skeleton until ready).
- **Real-time sync**: `RealtimeSync` subscribes to Postgres changes on `transactions`, `categories`, `budgets`, `user_settings` tables per user.
- **No test runner, no typecheck script.** Add one if needed.
- **`noUnusedLocals`/`noUnusedParameters` are `false`** in tsconfig, and `@typescript-eslint/no-unused-vars` is **off** in eslint. Unused vars are completely silent.
- **`gen-version` runs before dev/build**: `scripts/gen-version.js` writes `src/lib/version.ts` from git commit count + short hash.
- **Theme (dark/light/system)** — controlled by `settings.theme` in zustand. A blocking inline script in `RootShell` reads localStorage (`money-tracker-theme` key) to prevent flash. `ThemeSync` component handles `matchMedia` listener for system mode and updates `theme-color` meta. Default is `"dark"`.
- **Tailwind v4 source scanning**: `@import "tailwindcss" source(none)` + `@source "../src"` — only `src/` is scanned.
- **CSS is imported as URL**: `import appCss from "../styles.css?url"` in `RootShell` (`<link>`), not as a side-effect import.
- **`routeTree.gen.ts`** is auto-generated (excluded from prettier). Never edit by hand.
- **Locale**: Indonesian (labels, errors, empty states). Default currency: IDR. Month names are Indonesian.
- **UID generation**: `crypto.randomUUID()` with `Math.random().toString(36).slice(2)` fallback.
- **SSR error recovery**: `src/server.ts` intercepts swallowed h3 errors and renders an HTML error page instead of JSON 500.
- **Do NOT import from `server-only`** — ESLint blocks it. Use `.server.ts` suffix instead.
- **`resetAll()`** wipes all Supabase data (transactions, budgets, categories) and re-seeds 12 default categories.
- **Icons**: Primary icon library is `lucide-react` (defaults.ts icon names map to lucide icons). `@tabler/icons-react` is used sparingly in `history.tsx` and `index.tsx` (`IconReceipt`).

## Architecture

- Entry: `src/start.ts` → `src/router.tsx` → `src/routes/__root.tsx`
- Routes in `src/routes/`, file-based. See `src/routes/README.md` for naming conventions.
- `@/*` path alias → `./src/*`
- Build artifacts (`.output`, `.vinxi`, `.tanstack/`) are gitignored.
