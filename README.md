# Crema — Coffee Journal

A local-first coffee brewing and tasting journal: track beans, grinders, and
individual brews (espresso, V60, AeroPress) with recipe data, tasting notes,
and ratings. Mobile-first, usable fully offline with no account required —
signing in is optional and only enables sync.

## Status

**Phase 1 complete**: design system, static UI, all screens are built and
navigable, backed by in-memory sample data.

**Phase 2 (not started)**: Effect.ts for state management, local SQLite
storage (browser, via WASM/OPFS), and backend sync that activates once
signed in.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, runes) + TypeScript + Vite
- Design tokens ported from a Claude Design source project — see
  `src/lib/styles/app.css` for the full palette/type system
- No backend yet; all data currently lives in in-memory stores under
  `src/lib/stores/` (reset on page reload — this is a Phase 1 stand-in)

## Developing

This machine has no global Node.js — a project-local Nix flake
(`flake.nix`) provides `nodejs_22`. Run everything through `nix develop`:

```sh
nix develop -c npm run dev        # start the dev server
nix develop -c npm run dev -- --open
nix develop -c npm run check      # type-check (svelte-check)
nix develop -c npm run build      # production build
nix develop -c npm run preview    # preview the production build
```

If you have Node 22+ on your PATH already, the plain `npm run ...` commands
work too — the flake just exists so this repo doesn't require anything
installed globally on NixOS.

## Project structure

```
src/
├── lib/
│   ├── styles/app.css       design tokens + base mobile app CSS classes
│   ├── data/                 types.ts (Bean/Grinder/Brew) + sample.ts (seed data)
│   ├── icons/Icon.svelte     the full hand-drawn icon set, one component
│   ├── stores/                journal/auth/theme state (Phase 1 in-memory stand-ins)
│   └── components/           shared UI (Sidebar, TopBar, cards, new-brew flow steps, ...)
└── routes/
    ├── +page.svelte           Journal / Home
    ├── beans/[id]?             Beans list + detail
    ├── grinders/[id]?          Grinders list + detail
    ├── brew/[id]/(compare)     Brew detail + compare-to-last
    ├── stats/                  Insights
    ├── new/                    4-step New Brew flow (Bean → Brew → Taste → Verdict)
    └── login/                  Sign in / create account (never a gate — app works without it)
```

Sidebar nav (desktop, ≥860px) and bottom nav + FAB (mobile) share the same
routes and components — the layout switches via a CSS breakpoint, not a
separate app.

## Notes

- App usage requires no login. A dismissible banner and sidebar footer link
  point to `/login`, but every screen works fully offline first.
- The "paid plan / trial" step from the original design's sign-up flow was
  deliberately left out — it's a monetization feature tied to a backend that
  doesn't exist yet.
