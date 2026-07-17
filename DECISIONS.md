# DECISIONS.md

## D1 — CSS-first theming instead of a Tailwind config
- **Decision:** Use Tailwind v4 CSS variables + custom classes in `src/index.css` rather than utility classes or a UI library.
- **Why:** The site must port to an Elementor Pro / WordPress widget. Framework-agnostic CSS keeps the bundle light and the styles reusable without React.
- **Trade-off:** More CSS to write; less utility-class terseness.

## D2 — Demo auth via localStorage + OTP event contract
- **Decision:** Login/register uses a 6-digit OTP flow. In demo, any 6 digits pass. State is kept in `localStorage` under `chap-roshan-user`.
- **Why:** Lets the UI ship before the backend exists while documenting the integration contract (`ELEMENTOR-HANDOFF.md`).
- **Trade-off:** Not secure; must be replaced with Supabase/WooCommerce before production.

## D3 — react-router-dom for routes
- **Decision:** Multi-page SPA with BrowserRouter: `/`, `/login`, `/profile`, `/portfolio/:slug`.
- **Why:** Clean separation of landing, auth, profile, and detail surfaces while remaining a single bundle.

## D4 — Centralized portfolio data
- **Decision:** All project content lives in `src/data/portfolio.ts` as a typed array.
- **Why:** A single machine-readable source of truth for both the grid and the detail pages, easy to swap for a CMS later.

## D5 — Django + DRF Relational Backend Architecture
- **Decision:** Built a complete, dedicated Django & Django Rest Framework backend in a separate `/backend` directory.
- **Why:** To support secure OTP auth, persistent wizard order creation, server-side price validation, and a beautiful Persian RTL-ready Django Admin.
- **Trade-off:** Decoupled architecture requires configuring CORS and CORS allowed headers, which we fully set up in Django settings.
