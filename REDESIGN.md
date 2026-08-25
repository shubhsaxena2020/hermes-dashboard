# Redesign: Plesk-style Hosting Control Panel

Rebuilding the `web/` frontend of `hermes-dashboard` (the `vps-control` tool)
into a Plesk Obsidian–style hosting control panel that matches
`/home/ubuntu/dashboard-design-reference.png`.

## Status: BUILT & VERIFIED (2026-08-25)

## What was built
- **Grouped sidebar** (always dark slate `#1f2d3a`):
  - Hosting Services: Domains, Databases, Git, SSL/TLS, Backup Manager, File Manager, Mail
  - Server Management: Server, Statistics, Logs
  - My Profile: Profile, Security, Subscription
  - Active item: lighter slate fill + cyan left accent bar; Server item shows a
    red down-count badge. Theme toggle + build hash at the bottom.
- **Light topbar**: current section title, search, live connection dot, refresh, notifications.
- **Domains overview page** (`DomainOverview.tsx`): primary-domain card + per-domain
  **quick-action row** (Backup Manager, Databases, Git, SSL/TLS, File Manager, Mail)
  + SSL/TLS certificate list with expiry badges.
- **Right rail** (`RightRail.tsx`): Subscription card + Resource usage (Disk, Traffic,
  CPU, Memory) with risk-colored progress bars.
- **Server section** preserved (live container control, hardware panel) under
  "Server Management → Server".
- Honest placeholders (`SimplePanel`) for items with no first-class screen yet
  (Databases, Git, Backup, Files, Logs, Profile, Security, Subscription) — they
  link out where a real tool exists.

## Backend changes (Node/Express)
- `src/traffic.js`: new best-effort external traffic reader (`/proc/net/dev`).
- `src/server.js`: `/api/status` now also returns `traffic` and `subscription`.

## Design tokens (`web/src/index.css`, Tailwind v4 CSS-first)
- `--sidebar #1f2d3a`, `--background #f4f5f6`, `--brand #00a8d8`, white card,
  light border, lighter `--sidebar-active #324b5e`.
- Sidebar colors live only in `:root` so the nav stays dark in both themes.
- Palette matches the quantified reference targets (see below).

## Verification (no browser available in this env — missing system libs for
Chromium; no root to apt-install). What we DID verify:
- `npm run build` ✅ (tsc -b + vite) — production bundle rebuilt.
- `npm run lint` ✅ 0 errors.
- `npm run test` ✅ 64 tests pass (existing suites untouched).
- Backend `/api/status` smoke test (with dev `.env`) returns `traffic`,
  `subscription`, `oracle`, `tls` correctly.
- **Color fidelity**: parsed the REAL compiled CSS and checked resolved tokens
  against the measured reference pixels:
  - sidebar base `#1f2d3a` dark slate ✅
  - content bg `#f4f5f6` exact match to reference ✅
  - brand accent `#00a8d8` exact match to reference ✅
  - card white, border light grey, nav-active lighter than base ✅
- **Structure**: SSR'd the real components and asserted every required Plesk
  label is present (no missing labels).

## What we could NOT do (honest limitation)
- Live browser pixel-screenshot diff vs the reference image: Chromium can't
  launch here (missing `libatk-1.0.so.0`, `libcups.so.2`, etc.; no sudo/apt).
  weasyprint 61 dropped PNG export. So visual confirmation is via computed-CSS
  token comparison (above), not a rendered pixel diff.

## Local run
- Backend: `npm install` (root) then `node src/server.js` (needs `DASHBOARD_USER`/
  `DASHBOARD_PASSWORD` in `.env`; `.env` is gitignored — a dev-only one was added
  locally, NOT committed).
- Frontend dev with mock data: `cd web && VITE_MOCK=1 npm run dev`.
- Production: `cd web && npm run build` → backend serves `web/dist`.

## Notes
- The reference image's exact text labels couldn't be recovered (vision model
  unavailable in this env), so the sidebar/quick-action vocabulary follows the
  user's task description + standard Plesk Obsidian conventions.
- Multi-domain cards use `tls[]` domains as stand-ins; when the backend exposes
  a real domains list, map it in `DomainOverview`.
