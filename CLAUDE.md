# CLAUDE.md — چاپ روشن (Chap Roshan)

> This is a fully Persian (RTL) print-studio marketing + ordering website built with React 19, Vite 7, and Tailwind CSS v4. It ships as a single-file bundle designed to be embedded as an Elementor Pro / WordPress / WooCommerce widget.

This file is the entry instruction file for any AI coding agent working in this repository. Read it first, every session.

## Overview

- **What this system is:** a Persian print-shop storefront with a 4-step order wizard, a portfolio with per-project detail pages, OTP login/register, and a customer profile panel.
- **Stack:** React 19 + react-router-dom (HashRouter-style SPA), framer-motion, lucide-react, Tailwind v4 (CSS-first, no tailwind.config).
- **Routing:** `/` home, `/login` OTP auth, `/profile` customer panel, `/portfolio/:slug` project detail.
- **Theming:** dark/light via `data-theme` on `<html>` and CSS variables in `src/index.css`.
- **Auth state:** `src/contexts/AuthContext.tsx` (demo persists to localStorage; swap for Supabase/WooCommerce in production).

## Verification (run this before every commit)

The repository is in a **consistent state** only when the build exits 0:

```bash
make check        # runs the full verification pipeline (build + type-check)
```

That target runs `npm run build`, which executes TypeScript type-checking and the Vite production build. If `make check` fails, the repo is NOT consistent — fix it before doing anything else. `npm test`/test layer is described in `feature_list.json` (verification plan).

## Clock-in (session start)

Before touching code:
1. Read `PROGRESS.md` to see what happened last session and what is in progress.
2. Run `make check` to confirm a green baseline.
3. Read `feature_list.json` to find the next feature with `state: "planned"` or `"active"`.

## Clock-out (session end)

Before closing:
1. Run `make check` and confirm it exits 0.
2. Update `PROGRESS.md` (Current State + Next Steps).
3. Commit. Write commit messages that explain **why** the change was made, not just what changed.

## Constraints (MUST / MUST NOT)

- **MUST NOT** edit `package.json` or `vite.config.ts` directly. Use the package installer tool for new dependencies.
- **MUST** keep all user-facing copy in Persian and the document `dir="rtl"`.
- **MUST** run `make check` before declaring any task done.
- **MUST NOT** treat `localStorage` as a secure credential store — it is a demo fallback only.
- **MUST** keep styling framework-agnostic (plain CSS classes + CSS variables in `src/index.css`) so it can port to an Elementor/WordPress widget.
- **MUST NOT** add a UI component library (the brief requires minimal, lightweight output).

## Definition of Done

A task is complete when runtime evidence passes — not when the code is written or the agent is confident. Three layers, do not skip a layer if an earlier one fails:
- **Layer 1 (syntax/static):** `make check` builds with no type errors.
- **Layer 2 (runtime behavior):** the page/route renders and the affected interaction works (manually verified).
- **Layer 3 (system confirmation):** full build output (`dist/index.html`) is produced and serves.

## Scope: WIP = 1

Only one feature may have `state: "active"` at a time. Complete it and move it to `passing` in `feature_list.json` before activating the next. Do not overreach or half-finish three things.

## Architecture Boundaries

- `src/App.tsx` — landing page (single component).
- `src/pages/` — routed pages (Login, Profile, PortfolioDetail).
- `src/contexts/AuthContext.tsx` — auth provider (single source of truth for the logged-in user).
- `src/data/portfolio.ts` — portfolio content (machine-readable source of truth for projects).
- `src/index.css` — all styles (CSS variables + component classes).
- See `src/ARCHITECTURE.md` for the module-level design.

## State files

Agent-readable state lives in: `PROGRESS.md`, `DECISIONS.md`, `feature_list.json`. Keep them updated in the same commit as the code change — no stale documentation.

## Commit atomicity

One logical operation per commit; the repository must be in a consistent state (verification passing) after every commit. If running low on context, do NOT rush to finish — stop, update `PROGRESS.md`, and commit a clean checkpoint.
