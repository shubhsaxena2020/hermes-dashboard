# vps-control

Dashboard to start/stop the GCP `firecrawl-host` VPS on demand and see both
VPS's status in one place. Design spec: `docs/superpowers/specs/2026-07-08-vps-control-dashboard-design.md`.

## Status: live at https://control.shubhbuilds.com

Everything is deployed and tested end-to-end: Oracle status, GCP status,
Start/Stop buttons, live queue/container/log detail while GCP is on, and
auto-idle-shutdown. Login credentials are in `.env` on Oracle VPS (not
committed to git).

### Features

- **Overview tab**: VPS status with uptime, TLS certificate expiry, estimated monthly cost
- **VPS tab**: live hardware usage (CPU, memory, disk), container table with start/stop/restart controls, log viewer with line filtering
- **Dark mode**: toggle in the sidebar; defaults to system preference
- **Auto-polling**: status refreshes every 5 seconds; manual refresh and error indicator in the toolbar
- **Keyboard shortcuts**: Alt+1 for Overview, Alt+2 for VPS tab

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
- **iter-62** — Extract shared color threshold utility: removed duplicated progressIndicatorClass/healthIndicatorClass from HardwarePanel and OverviewSection, consolidated into web/src/lib/color-threshold.ts.
- **iter-63** — API response time: useStatus hook now tracks fetch duration via performance.now(); toolbar displays response time (e.g. "45ms") next to the "Updated" label so connection health is visible at a glance.
- **iter-64** — Loading skeleton toolbar: added skeleton placeholders for the Updated/response-time/Refresh toolbar row to eliminate layout shift on initial data load.
- **iter-65** — TLS expiry dates: each certificate card now shows the formatted expiry date (e.g. "Expires Sep 15, 2026") below the domain name, and issuer info is available via hover tooltip.
- **iter-66** — Smarter time formatting: the "Updated" toolbar label now shows minutes, hours, or days instead of raw seconds.
- **iter-67** — Keyboard shortcuts: Alt+1 switches to Overview, Alt+2 switches to VPS tab, enabling fast keyboard-driven navigation without using the sidebar.
- **iter-68** — Connection health indicator: added a colored status dot to the toolbar (green = connected, red = disconnected) for at-a-glance backend health visibility.
- **iter-69** — VPS uptime: added os.uptime() to the backend hardware payload; Overview VPS card now displays uptime (e.g. "12d 5h") for at-a-glance server stability visibility.
- **iter-70** — Keyboard shortcut hints: added `<kbd>` visual indicators next to sidebar nav items (Alt+1, Alt+2) on desktop for discoverability.
- **iter-71** — Container resource bars: added inline CPU% and Memory% progress bars to each container row in the infrastructure table, replacing raw text with color-coded visual indicators for at-a-glance resource monitoring.
- **iter-72** — Down-container names: Overview VPS card now shows which containers are down by name, reducing the need to switch to the VPS tab for status triage.
- **iter-73** — Container actions responsive wrap: action buttons (Start/Stop/Restart/Logs) in the infrastructure table now wrap on narrow viewports instead of overflowing, fixing a mobile responsiveness regression.
- **iter-75** — Container status accessibility: added colored dot indicator to the status column for colorblind users (non-color signaling).
- **iter-76** — TLS cert urgency sort: certificates are now sorted by days remaining (ascending), with error certs first, so the most urgent renewal appears at a glance.
- **iter-77** — VPS tab container health: added "{up}/{total} up" badge to the VPS tab header for at-a-glance container health visibility.

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
