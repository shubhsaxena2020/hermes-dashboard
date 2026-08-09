# vps-control

Dashboard to start/stop the GCP `firecrawl-host` VPS on demand and see both
VPS's status in one place. Design spec: `docs/superpowers/specs/2026-07-08-vps-control-dashboard-design.md`.

## Status: live at https://control.shubhbuilds.com

Everything is deployed and tested end-to-end: Oracle status, GCP status,
Start/Stop buttons, live queue/container/log detail while GCP is on, and
auto-idle-shutdown. Login credentials are in `.env` on Oracle VPS (not
committed to git).

### Features

- **Overview tab**: VPS status, TLS certificate expiry, estimated monthly cost
- **VPS tab**: live hardware usage (CPU, memory, disk), container table with start/stop/restart controls, log viewer with line filtering
- **Dark mode**: toggle in the sidebar; defaults to system preference
- **Auto-polling**: status refreshes every 5 seconds; manual refresh and error indicator in the toolbar

### Changelog

- **iter-50** — Dark mode toggle: added ThemeProvider (next-themes) in main.tsx, Sun/Moon toggle button in sidebar (App.tsx).
- **iter-51** — Error state tracking: useStatus hook now surfaces poll errors; "Stale — poll failed" indicator added to toolbar; manual Refresh button with aria-label added.
- **iter-52** — UI polish: upgraded Refresh to shadcn Button with RefreshCw icon; normalized all action buttons to size="default" (sm→default); added aria-current on nav items; added flex-wrap on toolbar; added Features section to README.
- **iter-53** — Architecture: extracted sidebar navigation into dedicated Sidebar.tsx component, reducing App.tsx from 107 to 78 lines.
- **iter-54** — Loading skeleton: added skeleton placeholder for initial data fetch.
- **iter-55** — Responsive sidebar: added hamburger menu for mobile with slide-in overlay, keyboard accessibility (Escape key, focus management), and responsive main padding.
- **iter-56** — Error boundary: added class-based ErrorBoundary component wrapping section content; catches render crashes with a labeled recovery card and "Try again" button.
- **iter-57** — Hardware panel visual feedback: added color-coded progress bars (yellow ≥60%, red ≥80%) and inline memory percentage for at-a-glance resource health.
- **iter-58** — Accessibility: added aria-hidden="true" to decorative SVG icons in hamburger menu, refresh button, and theme toggle for cleaner screen reader output.
- **iter-59** — Overview health card: added compact memory and disk progress bars to the Overview tab so system health is visible at a glance without switching to the VPS tab.
- **iter-60** — Quick links restyle: converted plain anchor links to outlined buttons with external-link icons; added flex-wrap for responsive wrapping on narrow viewports; updated loading skeleton to match.
- **iter-61** — CPU usage monitoring: added real-time host CPU utilization via os.cpus() sampling on the server; new color-coded progress bar in both the VPS Hardware panel and Overview system health card, completing the hardware monitoring triad (CPU, memory, disk).

### How the GCP credential is handled

This project blocks service-account key creation at the org level, so the
dashboard authenticates using a personal OAuth token
(`gcloud auth application-default login`, `cloud-platform` scope) mounted
into the container. That's broader access than strictly needed for
start/stop/status, but was a deliberate choice for a single-user,
password-protected tool rather than building a second non-public service
to hold it. Revisit if this ever becomes multi-user or public-facing.

### How Oracle reaches GCP for live detail

A dedicated `vps-control` SSH key (generated on Oracle VPS, registered in
GCP's instance metadata for `firecrawl-host` only) plus a narrow sudoers
rule on the GCP side — `vps-control` can run exactly three fixed read-only
scripts (`/usr/local/bin/vps-poll-{containers,queue,logs}.sh`) via
passwordless sudo, nothing else. Not full docker-group access.

## Local dev

```
cp .env.example .env   # fill in DASHBOARD_PASSWORD
npm install
npm start
```

## Deploy

Own docker-compose project on Oracle VPS at `/opt/apps/vps-control`, fronted
by Caddy (see `Caddyfile.snippet`) at `control.shubhbuilds.com`.
