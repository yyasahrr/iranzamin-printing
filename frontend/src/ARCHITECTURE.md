# ARCHITECTURE — `src/`

This module-level document describes how the front-end code is organized and the invariants each layer must keep.

## Layers and boundaries

```
src/
├── App.tsx                  # Landing page (single component). No routing logic lives here.
├── main.tsx                 # Router + AuthProvider + route table. The ONLY place routes are declared.
├── index.css                # All styling. CSS variables drive theming; no inline Tailwind config.
├── contexts/
│   └── AuthContext.tsx      # Single source of truth for the logged-in user. Pages MUST use useAuth().
├── data/
│   └── portfolio.ts         # Typed content source of truth for projects (grid + detail).
└── pages/
    ├── LoginPage.tsx        # OTP flow. Reads/writes auth via useAuth(), never touches localStorage directly for the session.
    ├── ProfilePage.tsx      # Customer panel. Uses useAuth() to read AND update the user (no full reload).
    └── PortfolioDetailPage.tsx  # Reads project by slug from src/data/portfolio.ts.
```

## Invariants

- **Auth flows through the context.** Components must not call `localStorage` for the user object directly; they use `login()`/`logout()` from `AuthContext`. (In F04 this removes a full-page reload anti-pattern.)
- **One route table.** All routes are declared in `main.tsx`. Adding a page means adding a route there plus a catch-all.
- **Content is data.** Portfolio text/specs live in `src/data/portfolio.ts`, not hardcoded in JSX, so it can be swapped for a CMS.
- **Theming via CSS variables.** Colors live as `--var` tokens in `index.css`; components reference classes, not hard-coded colors.
- **RTL everywhere.** Every page sets `dir="rtl"`; Persian copy only.

## Known technical debt

- Auth and orders are demo-only (localStorage). See `DECISIONS.md` D2.
- No automated tests yet (`feature_list.json` F07).
