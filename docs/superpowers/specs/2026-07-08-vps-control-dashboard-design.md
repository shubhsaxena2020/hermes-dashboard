# VPS Control Dashboard — Design Spec

Date: 2026-07-08

## Problem

The GCP VPS (`firecrawl-host`) runs the Firecrawl-based search/scrape pipeline
that enriches gym leads with emails. Unlike the Oracle VPS (Always Free tier),
it's a billed `e2-standard-4` instance and should not run 24/7. The user wants
it off by default, started on demand when they're actively working, and a
single dashboard to see and control both VPS's instead of juggling `gcloud`
commands and SSH sessions by hand.

## Goals

- One-click start/stop of the GCP VPS from a web dashboard.
- The dashboard is reachable at all times, even while the GCP VPS is off.
- When the GCP VPS is on, the dashboard shows live queue progress, container
  health, and recent worker activity.
- The GCP VPS shuts itself down automatically after sitting idle, as a
  safety net against forgetting to stop it.
- Oracle VPS's own status is shown too, but only as a summary + links to the
  tools that already exist for it (`leads.shubhbuilds.com`, Portainer) —
  not rebuilt.

## Non-goals

- Rebuilding Portainer or the existing leadgen campaign dashboard.
- Multi-user auth, roles, or anything beyond single-user basic auth.
- Automated test suite — this is a personal single-operator ops tool,
  validated by hand.

## Architecture

A new service, `vps-control`, deployed the same way as the other Oracle VPS
apps: its own git-tracked docker-compose project under `/opt/apps/`, exposed
through Caddy on a new subdomain (`control.shubhbuilds.com`), protected by
HTTP basic auth (same pattern as `leads.shubhbuilds.com`).

- **Stack**: Node/Express backend, serving a single-page frontend (plain
  HTML/JS, polling a JSON status endpoint — no SPA framework needed for two
  status cards and two buttons).
- **Runs on Oracle VPS** (always-on) — this is what makes it possible to
  start the GCP VPS remotely; a control panel running *on* the GCP VPS
  couldn't turn itself on.

### Backend responsibilities

1. **GCP power control** — calls the GCP Compute Engine API
   (`instances.start` / `instances.stop` / `instances.get`) using a new,
   narrowly-scoped service account: permission to start/stop/view only the
   `firecrawl-host` instance, nothing else in the project.
2. **GCP status polling** (only while the instance is running) — SSHes into
   the GCP VPS (server-to-server, using a key added to the GCP project the
   same way the existing `shubh` login works) to fetch `docker ps` output,
   `staging_leads` queue counts, and the last ~15 lines of `data-worker`'s
   log.
3. **Oracle status** — local `docker ps` on the same machine (no SSH needed)
   plus static links to `leads.shubhbuilds.com` and Portainer.

### GCP-side prerequisites (fixes required before the power button works cleanly)

- **Restart policy audit**: currently only `staging-db`, `data-worker`, and
  `searxng` have `restart: unless-stopped`. The services from the upstream
  Firecrawl compose file (`api`, `redis`, `rabbitmq`, `playwright-service`,
  `nuq-postgres`, `foundationdb`) do not, so a VM reboot would leave them
  stopped even though the VM itself is "on." All of them need
  `restart: unless-stopped` added. `foundationdb-init` is intentionally
  excluded — it's a one-shot job (`restart: "no"`) and should stay that way.
- **Firewall**: the current SSH rule only allows a stale Cloud Shell IP.
  Needs to allow the Oracle VPS's static IP so it can reach the GCP VPS for
  status polling once it's on.
- **Auto-idle-shutdown**: `data-worker`'s existing poll loop gets a check —
  track the last time the queue had `PENDING`/`PROCESSING` work; once idle
  longer than a configurable threshold (default 20 min), write a marker
  file into its already-mounted `/app` directory. A host-level cron job
  (checked every minute, outside the container — avoids granting the
  container elevated privileges) sees the marker and runs a clean
  `shutdown -h now`, which stops the GCE VM the same as the dashboard's
  Stop button would. The marker is cleared on boot, and `data-worker`
  clears its own marker if new work shows up before the cron acts on it
  (avoids a race where a late-arriving campaign gets shut down out from
  under it).

## Dashboard UI

**GCP card:**
- *Off*: "Stopped" + `Start` button. A one-line note that a stopped
  instance only costs disk storage (~$2/mo), not compute.
- *Booting*: spinner/"Starting…" while waiting for SSH to come up
  (typically 30-60s).
- *On*: `Stop` button, plus three live blocks — lead queue counts
  (pending / processing / needs review / done), container health list
  (name + up/down), and the last ~15 `data-worker` log lines. Auto-refreshes
  every few seconds.

**Oracle card:** always the same — its own container list, plus links to
`leads.shubhbuilds.com` and Portainer.

## Error Handling & Edge Cases

- GCP API call fails (network/quota/billing): show the actual error, not a
  silent failure or hang.
- Double-clicks / conflicting actions: backend checks the VM's actual
  current state before acting; the button disables itself mid-transition.
- VM shows "running" in GCP's API but SSH isn't up yet: shown as "on, but
  not reachable yet" rather than an error — this is normal during boot.
- Idle-shutdown race: `data-worker` clears its own marker file the moment
  it sees new work, so a campaign that starts right at the idle threshold
  can't get shut down from under it.
- Oracle-side backend crashing has no real consequence — it's stateless
  (reads live status on demand) and restarts on its own like every other
  service there.

## Testing / Rollout

No automated test suite. Validated by hand:
1. Click Start, confirm the *entire* stack comes back on its own (proves
   the restart-policy fix, not just that the VM powered on).
2. Click Stop, confirm clean shutdown.
3. Temporarily lower the idle threshold, confirm auto-shutdown actually
   fires, then set it back to the real default.
