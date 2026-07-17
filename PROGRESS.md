# PROGRESS.md

## Current State

- Last commit: feat — Full-stack Modular Monolith & Job-Centric production architecture
- `make check`: passing (`npm run build` and `npm test` exit 0, dist/index.html produced)
- Bundle: ~550 kB (~161 kB gzipped)

## In Progress

- Phase 5: ZarinPal real IPG payment verification.

## Completed

- Complete Frontend-Backend integration (wired React with Django APIs for OTP login, verify OTP, save profile, submit orders with file uploads, and callback requests)
- Robust, self-defending architecture (graceful localStorage/demo fallback if the backend server is offline)
- Automated unit test suite with **Vitest** testing pricing/factor calculation logic
- Integration of `npm test` into the root `Makefile` so that `make check` guarantees both type-checking and unit test verification
- Django backend with SQLite/PostgreSQL relational database schema design (accounts and orders)
- OTP login and registration backend endpoints (mock OTP generator & verify token flow)
- 4-step wizard backend system (models, serializers, and APIs for products, finishes, orders, callback, and server-side price recalculation)
- Seeding script `seed_data` matching wizard products and finishes with frontend
- Custom Django Admin panel tailored for printing shop with sum earnings, active orders counts, and file download support
- Complete documentation in Persian for installation, APIs, and React integrations
- Landing page (hero, services, partners marquee, 4-step order wizard, portfolio, process, contact, footer)
- Infinite partners logo marquee: auto-scrolls, pauses on hover, hovered logo turns accent color
- Enterprise section (#enterprise): stat bar (۲۰۰+ پروژه / ۱۵+ سال / ۹۸٪ رضایت / ۲۴ساعت پاسخ‌گویی), 3×2 service cards with icons, horizontal 4-step contract timeline, sticky contact card with callback form, localStorage + `chap-roshan:callback-requested` event — fully responsive
- Dark/light theme toggle (persisted)
- OTP login/register page (`/login`)
- Customer profile panel (`/profile`) with orders / info / settings tabs
- Portfolio detail pages (`/portfolio/:slug`) with gallery, specs, testimonial, CTA
- WordPress/Elementor/WooCommerce/Supabase integration contract (`ELEMENTOR-HANDOFF.md`)
- **Phase 2 Customer Dashboard:** Built a complete, responsive user center with stats, WooCommerce-style tracking modal, support ticketing, internal chat, and shipping address CRUD.
- **Phase 3 Core Design System:** Developed a set of reusable TSX components under `frontend/src/components/core/` (`AppButton`, `AppCard`, `AppInput`, `AppBadge`, `AppModal`) complying with prefix conventions, fluid transitions, and CSS custom properties.
- **Phase 4 Modular Monolith & Job-Centric Architecture:** Refactored core layers under `apps/core/` (BaseModel with soft-delete, BaseService, BaseRepository, Pub-Sub Event System). Decoupled `Order` (billing unit) from `Job` (production unit), enabling multi-item/file processing.

## Next Steps

- Integrate ZarinPal or Sadad payment gateways.
- Configure PostgreSQL database settings on the production server.

## Blockers

- None. Full-stack modular monolith, design system, and job-centric workflow engines are 100% complete.
