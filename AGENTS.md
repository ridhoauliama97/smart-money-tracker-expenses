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
- **Runtime**: Bun (see `bunfig.toml` — 24h supply-chain guard)
- **UI**: shadcn/ui (new-york style), Radix, Tailwind CSS v4
- **State**: zustand + persist (localStorage key: `money-tracker-v1`)
- **Build**: Vite via `@lovable.dev/vite-tanstack-config` (includes tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, etc. — **do not add these plugins manually**)
- **Deploy target**: Cloudflare Workers (nitro preset `cloudflare-module`)

## Commands

| Command                               | Action                            |
| ------------------------------------- | --------------------------------- |
| `bun dev`                             | Dev server (vite)                 |
| `bun run build`                       | Production build                  |
| `bun run build:dev`                   | Dev-mode build                    |
| `bun run preview`                     | Preview build output              |
| `bun run lint`                        | ESLint all files                  |
| `bun run format`                      | Prettier --write all files        |
| `npx wrangler --cwd ./.output dev`    | Preview Cloudflare Worker locally |
| `npx wrangler --cwd ./.output deploy` | Deploy to Cloudflare Workers      |

No test runner, no typecheck script. Add one if needed.

## Architecture

- **All data is client-only** in localStorage. No backend database.
- Entry: `src/start.ts` → `src/router.tsx` → `src/routes/__root.tsx`
- SSR server entry overridden by `src/server.ts` (configured via `vite.config.ts` `tanstackStart.server.entry = "server"`). Adds error-capture and renders an error page instead of JSON 500 responses.
- Routes in `src/routes/`, file-based. `routeTree.gen.ts` is auto-generated — never edit by hand.
- zustand store (`src/store/useFinance.ts`) uses `skipHydration: true` — rehydrate manually in `AppShell` via `useFinance.persist.rehydrate()`.
- `@/*` path alias maps to `./src/*`.

## Conventions

- File-based routing: `src/routes/__root.tsx` is the root layout (not `app/layout.tsx`). See `src/routes/README.md`.
- Do NOT import from `server-only` — ESLint blocks it. Use `.server.ts` file suffix instead.
- `.prettierrc`: double quotes, semicolons, trailing commas, 100 print width.
- CSS: Tailwind v4 `@import "tailwindcss"` syntax, `@theme` directive for custom tokens.
- UI uses **Indonesian** language (labels, errors, empty states). Always dark mode (`html class="dark"`).
- Export: jspdf for PDF, xlsx for Excel.
- Lovable integration: `@lovable.dev/vite-tanstack-config` and error reporting hooks. Don't force-push or rewrite published git history.
