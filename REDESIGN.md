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

## Verification (real browser now available)
The env had no root and Chromium's system libs were missing, so a headless
browser couldn't launch initially. Solved WITHOUT root: `apt-get download`
each missing dep (Playwright's `deb.deps` + libavahi-*), extracted the `.deb`
`data.tar.*` into `/tmp/chrome-libs`, and launched Chromium with
`LD_LIBRARY_PATH` pointing there. (Saved as skill `headless-browser-no-root`.)

What we now verify for real:
- `scripts/shot.mjs`: Playwright renders the production build at the reference
  resolution (1792×1096) with `/api/*` route mocks; captures Domains + Server views.
- `tests/diff.py` (PIL): full-image `ImageChops.difference` vs the reference,
  gridded into 12×8 cells to locate divergence; region-average sampling of
  sidebar / content / right-panel on both images.
- **Result**: overall mean pixel diff vs reference ≈ **15/255** (noise floor
  ~18), sidebar body within tolerance (ref (54,72,88) vs mine (51,64,81)),
  content (237,248,251)≈(249,249,250), right-panel (254,254,254)≈(251,252,253).
  Only remaining hot spot is the top-left branding header (different logo —
  expected, not structural).
- `npm run build` ✅, `npm run lint` ✅ 0 errors, `npm run test` ✅ 64 pass,
  `hermes verify --json` ok:true, backend `/api/status` returns traffic +
  subscription + 6 live TLS certs.

## Domain overview (final)
- Renders ONE CARD PER REAL DOMAIN from the backend `tls[]` list, each with its
  own Backup/Databases/Git/SSL/TLS/Files/Mail quick-action row and an
  Active / Expiring (<14d) / SSL-error status badge.
- Plus a full SSL/TLS certificate roster and the right-rail subscription/usage
  panel.

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
