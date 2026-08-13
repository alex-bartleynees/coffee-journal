# Bloom — Coffee Journal

Bloom is a local-first coffee brewing and tasting journal. It tracks beans,
grinders, machines, brewing methods, and individual brews with recipe data,
tasting notes, ratings, and bean-bag photos.

The app is mobile-first, installable as a PWA, and fully usable offline without
an account. Signing in is optional; a Bloom Sync subscription adds multi-device
record and photo sync.

## Status

Bloom is deployed at [app.coffeesjournal.com](https://app.coffeesjournal.com)
and is currently being dogfooded ahead of its public launch.

- Local SQLite/OPFS persistence, offline PWA support, authentication, billing,
  record sync, and cross-device bean-photo sync are live.
- Machines and data-driven brewing methods are live with local CRUD and sync.
  They are completing a multi-day production soak test with no issues found so
  far.
- Bean photos are syncing successfully across devices in production.
- The next product phase is subscriber-only AI autofill from bean-bag photos,
  followed by the `coffeesjournal.com` marketing-site launch.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) with Svelte 5, TypeScript, and Vite
- SQLite WASM in a Web Worker, persisted locally through OPFS
- Effect for sync orchestration and typed application workflows
- A service worker and web app manifest for installable offline PWA support
- A separate Effect/Node/Postgres sync API, with authentication through the BFF
- Private Backblaze B2 storage for subscriber photo sync
- Stripe-backed Bloom Sync subscriptions

Design tokens and the visual system live in `src/lib/styles/app.css`.

## Developing

The project-local Nix flake provides Node.js 22 on machines without a global
Node installation:

```sh
nix develop -c npm run dev        # start the development server
nix develop -c npm run dev -- --open
nix develop -c npm test           # run the Vitest suite
nix develop -c npm run check      # run Svelte and TypeScript diagnostics
nix develop -c npm run build      # create the production build
nix develop -c npm run preview    # preview the production build
```

If Node.js 22 or newer is already available, the plain `npm` commands work too.

## Project structure

```text
src/
├── lib/
│   ├── components/          shared UI and New Brew flow
│   ├── data/                domain types, sample data, and pure data helpers
│   ├── db/                  SQLite schema, worker, queries, and sync queries
│   ├── images/              local bean-photo processing and persistence helpers
│   ├── stores/              journal, authentication, search, and theme state
│   ├── styles/app.css       design tokens and shared application styles
│   └── sync/                record and photo synchronization engines
├── routes/
│   ├── +page.svelte         journal and brew history
│   ├── account/             Bloom Sync account management
│   ├── beans/               bean list, detail, create, and edit flows
│   ├── brew/                brew detail and comparison
│   ├── grinders/            grinder list, detail, create, and edit flows
│   ├── machines/            machine list, detail, create, and edit flows
│   ├── methods/             brewing-method list, detail, create, and edit flows
│   ├── new/                 four-step New Brew flow
│   ├── pricing/             Bloom Sync subscription entry point
│   ├── stats/               brewing insights
│   └── login/ + signup/     Keycloak-backed authentication entry points
└── service-worker.ts        offline shell and runtime caching
```

Desktop navigation and split-pane detail views activate at `860px`; mobile uses
the same routes and components with bottom navigation and full-screen details.

## Product model

- The journal remains free and device-local forever.
- Accounts are optional and never gate the offline journal.
- Bloom Sync is the paid feature: it synchronizes journal records and bean
  photos across devices.
- AI bean-bag autofill will be subscriber-only and will always present extracted
  details for review before saving.

## Roadmap

1. Complete the Machines and Methods production soak test.
2. Build AI-assisted bean autofill from bag photos, with a manual fallback and
   review-and-confirm workflow.
3. Validate the AI flow on mobile and across varied real-world packaging.
4. Update and deploy the marketing site at `coffeesjournal.com`, then publicly
   launch Bloom.
