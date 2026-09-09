# Hermes Dashboard

> **Version: v55** — Multi-service VPS control panel and fleet management dashboard.

A modern, responsive hosting management dashboard (inspired by Plesk/cPanel) designed to monitor and operate cloud infrastructure, containerized services, domains, SSL posture, and system health in a single unified interface.

Live deployment: [control.shubhbuilds.com](https://control.shubhbuilds.com)

---

## Overview & Key Capabilities

Hermes Dashboard provides an intuitive control surface for server fleet operations, combining host telemetry, container orchestration, and security inspection:

- **Host Fleet & Container Lifecycle Management**:
  - Live Docker container health and resource tracking (`docker ps`, `docker stats`) reporting container status, memory usage, and CPU percentages.
  - Safe, allowlisted container control actions: start, stop, and restart containers directly from the UI with real-time feedback.
  - Read-only live container log inspection with filtering and auto-scroll capabilities.
- **Caddy & SSL/TLS Certificate Posture**:
  - Multi-domain SSL/TLS tracking via active TLS handshakes (`/api/ssl`), tracking expiration dates, issuers, and remaining days.
  - Per-domain inline SSL security status badges on domain cards.
  - Focus navigation: one-click SSL quick action on any domain card immediately jumps to and highlights that specific domain's certificate.
  - Certificate posture health assessment in the dedicated Security panel.
- **Domain Management & Reachability Probing**:
  - Domain overview card roster (`/api/domains`) displaying mapped services and live HTTP/HTTPS status probe results.
  - Direct "Visit" links and domain-threaded quick actions (File Manager, Databases, SSL, Backups).
- **Hardware Telemetry & System Statistics**:
  - Real-time CPU utilization sampling via Node `os.cpus()` delta measurement.
  - Memory capacity, usage, and load averages (`os.loadavg()` 1m/5m/15m).
  - Disk utilization tracking via filesystem interrogation.
  - Network throughput monitoring and plan bandwidth metrics.
- **Service Panels & Tool Integrations**:
  - Dedicated panels for Databases, Git repositories, File Manager, and Backups.
  - Integrated reverse proxy relay for services like Firecrawl (`firecrawl.shubhbuilds.com`), transparently proxying Bearer token requests before dashboard Basic Auth.
- **Responsive UX & Keyboard Navigation**:
  - Clean light/dark mode powered by `next-themes`.
  - Mobile slide-out drawer with focus trapping and accessibility compliance.
  - Visibility-aware polling: automatically pauses background API requests when the browser tab is hidden to preserve server and client resources.
  - Keyboard shortcuts for rapid view switching.

---

## Architecture

The system is organized into two primary layers: a Node.js backend daemon and a modern Vite/React client.

```
hermes-dashboard/
├── src/                    # Node.js backend daemon
│   ├── server.js           # Express application, routes, and Basic Auth
│   ├── oracle-status.js    # Docker container health & stats collection
│   ├── oracle-docker-control.js # Allowlisted container lifecycle actions
│   ├── oracle-hardware.js  # os module CPU/RAM/loadavg & disk usage
│   ├── tls-status.js       # TLS socket probes for certificate expiry
│   ├── ssl.js              # Dedicated SSL certificate endpoint
│   ├── domains.js          # Domain registry & reachability probes
│   ├── firecrawl-relay.js  # Dedicated API proxy relay for Firecrawl
│   ├── traffic.js          # Network bandwidth tracking
│   └── version.js          # Version & build metadata
├── web/                    # Frontend SPA
│   ├── src/
│   │   ├── components/     # UI components, tables, panels, cards, sidebar
│   │   ├── hooks/          # React hooks (useStatus, useDomains, useJson)
│   │   └── lib/            # Navigation structure, badge logic, formatters
│   ├── package.json        # Vite, React 19, Tailwind CSS v4, Vitest
│   └── vite.config.ts      # Build and dev server configuration
├── Dockerfile              # Container definition
├── docker-compose.yml      # Service orchestration mounting /var/run/docker.sock
└── package.json            # Root scripts and server dependencies
```

### Technology Stack

- **Backend**: Node.js (CommonJS), Express 4, `express-basic-auth`, `dotenv`.
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, `@base-ui/react`, Lucide icons, `sonner`.
- **Testing & Quality**: Vitest, Playwright, Oxlint.
- **Proxy / Ingress**: Caddy reverse proxy handling public ingress and automatic TLS termination.

---

## Running the Dashboard

### Prerequisites

- Node.js >= 18
- Docker daemon (for container metrics and lifecycle control)
- Host environment credentials in `.env`

### Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```bash
PORT=4000
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=your_secure_password
SYSTEM_IP=123.45.67.89
```

### Port

The Express server listens on port **4000** by default (override via `PORT` in `.env`).

### Scripts (`package.json`)

From the root directory:

```bash
# Install root dependencies
npm install

# Install web dependencies and build frontend
npm --prefix web install
npm run build

# Start the server (serves API and web/dist static assets on port 4000)
npm start

# Run frontend tests
npm test

# Run linter
npm run lint

# Run full verification script
npm run verify
```

### Development

To develop the frontend with Vite hot module replacement (HMR):

```bash
cd web
npm install
npm run dev
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Consolidated server health: container stats, hardware usage, TLS summaries, traffic, and subscription info |
| `GET` | `/api/domains` | Roster of hosted domains with live reachability probe results and inline SSL metadata |
| `GET` | `/api/ssl` | Dedicated SSL/TLS certificate registry and expiration posture |
| `POST` | `/api/oracle/containers/:name/:action` | Control allowlisted container (`start`, `stop`, `restart`) |
| `GET` | `/api/oracle/containers/:name/logs` | Fetch container stdout/stderr logs |
| `GET` | `/api/databases` | Database services and connection endpoints |
| `GET` | `/api/git` | Registered deployment Git repositories |
| `GET` | `/api/files` | File manager storage roots and disk quota |
| `GET` | `/api/backups` | Scheduled and manual backup snapshots |
| `GET` | `/api/version` | Current release version and build commit hash |

---

## Docker Deployment

The dashboard can run directly as a Docker container with access to the host Docker socket:

```bash
docker compose up -d --build
```

The container exposes port 4000, which should be reverse-proxied behind Caddy or your ingress gateway.
