# vps-control

Dashboard to start/stop the GCP `firecrawl-host` VPS on demand and see both
VPS's status in one place. Design spec: `docs/superpowers/specs/2026-07-08-vps-control-dashboard-design.md`.

## Status: live at https://control.shubhbuilds.com

Everything is deployed and tested end-to-end: Oracle status, GCP status,
Start/Stop buttons, live queue/container/log detail while GCP is on, and
auto-idle-shutdown. Login credentials are in `.env` on Oracle VPS (not
committed to git).

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
