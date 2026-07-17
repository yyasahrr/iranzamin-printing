# PROGRESS.md

## Current State

- Last commit: feat — portfolio detail pages + auth + profile panel
- `make check`: passing (`npm run build` exits 0, dist/index.html produced)
- Bundle: ~459 kB (~141 kB gzipped)

## In Progress

- Harness-engineering audit remediation: adding instruction/state/verification files and fixing code-level bugs found by the audit.

## Completed

- Landing page (hero, services, partners marquee, 4-step order wizard, portfolio, process, contact, footer)
- Infinite partners logo marquee: auto-scrolls, pauses on hover, hovered logo turns accent color
- Enterprise section (#enterprise): stat bar (۲۰۰+ پروژه / ۱۵+ سال / ۹۸٪ رضایت / ۲۴ساعت پاسخ‌گویی), 3×2 service cards with icons, horizontal 4-step contract timeline, sticky contact card with callback form, localStorage + `chap-roshan:callback-requested` event — fully responsive
- Dark/light theme toggle (persisted)
- OTP login/register page (`/login`)
- Customer profile panel (`/profile`) with orders / info / settings tabs
- Portfolio detail pages (`/portfolio/:slug`) with gallery, specs, testimonial, CTA
- WordPress/Elementor/WooCommerce/Supabase integration contract (`ELEMENTOR-HANDOFF.md`)

## Next Steps

- Replace demo OTP with a real auth backend (Supabase Auth or WooCommerce).
- Persist orders server-side instead of localStorage.
- Add automated tests (Vitest) and wire `npm test` into `make check`.
- Promote server-side price recalculation before checkout.

## Blockers

- None currently. The auth backend and print_orders table need credentials before they can be wired.
