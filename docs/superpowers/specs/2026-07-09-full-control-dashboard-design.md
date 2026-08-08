# vps-control: full-control sidebar dashboard

Status: approved by delegation ("handle what's best for us, sidebar layout,
full control of docker/firecrawl/leadgen on both VPS") — user stepped away
mid-brainstorm and granted temporary full access to proceed without further
live review. This spec documents the decisions made in their absence.

## Problem

The current dashboard is two cards on one page: Oracle container list
(read-only) and GCP power/status. Everything else — restarting a stuck
container, starting/stopping a lead-gen campaign, checking what GCP hardware
is actually running — requires asking Claude to SSH in and do it by hand.
User wants one page with real controls for all of it.

## Scope

1. **Sidebar layout** — Overview / Oracle / GCP / Lead Generator sections,
   nav always visible, no more scrolling one long page.
2. **Oracle: full docker control** — start/stop/restart any container in a
   fixed allowlist (not arbitrary docker commands).
3. **GCP: full docker control** — same, for the firecrawl stack containers,
   via the existing scoped-SSH mechanism.
4. **GCP: hardware panel** — machine type, vCPU/RAM/disk spec (static, from
   the Compute API, works even when off) + live CPU/RAM/disk usage (via SSH,
   only when on).
5. **Lead Generator: campaign control** — start a campaign (business type,
   country, states form), see running campaigns with progress (states
   done/total), stop a running campaign. Requires adding a `GET
   /campaigns/status` route to the separate `lead-gen-system` project (it
   currently has no status endpoint at all — the existing leads.shubhbuilds.com
   page loses track of the running campaign on refresh, a real gap this
   fixes too).

## Explicitly out of scope

- No destructive actions anywhere (no remove/prune/delete-volume). Start,
  stop, restart only.
- No arbitrary docker exec / shell access from the dashboard.
- vps-control's own container is excluded from the controllable list
  (restarting itself mid-request is pointless self-harm, not a real need).
- No GCP billing/cost display — hardware spec + live usage only.
- No historical charts/metrics — current snapshot only, consistent with the
  existing polling model (5s refresh), not a monitoring product.

## Architecture

**Oracle docker control**: vps-control's docker socket mount changes from
`:ro` to `:rw`. A server-side allowlist (container names) gates every
action — the socket having write access doesn't mean the API accepts
arbitrary names. This is a real privilege increase or the container (docker
socket write access is host-root-equivalent), scoped down at the
application layer since Docker itself has no way to restrict *which*
containers a socket can control.

**GCP docker control**: extends the existing least-privilege SSH pattern
(scoped `vps-control` sudoers user, 3 fixed read-only wrapper scripts) with
one more wrapper script, `vps-docker-action.sh <start|stop|restart>
<container>`, which validates both the action and the container name against
a hardcoded case-statement allowlist before running `docker $action
$container` — never a passthrough. Same approach as the existing
`vps-poll-*.sh` scripts, just for actions instead of reads.

**GCP hardware**: static spec (machine type, disk size, zone) comes free
from the existing `compute.instances.get` call already used for
start/stop/status — just parsing more fields, no new API scope. Live usage
(`nproc`, `free`, `df`) is a 4th SSH wrapper script, same mechanism as the
container/queue/log pollers already in place.

**Lead-gen integration**: `leadgen` and `vps-control` already share the
`proxy` docker network on Oracle, so vps-control reaches
`http://leadgen:3000` directly, container-to-container — no public HTTP
round-trip, no auth needed (the leadgen app itself has no internal auth;
Caddy's basic-auth only guards the public domain, not internal traffic).
`lead-gen-system` gets one additive change: `GET /campaigns/status`
returning running campaigns with each one's `state_queue` progress
(pending/in_progress/done counts) — read-only, no change to existing
start/stop behavior.

## UI

Single-page app, sidebar nav (Overview / Oracle / GCP / Lead Generator),
vanilla JS section-toggling (no framework/build step — consistent with the
existing app's size and stack). Same dark theme. Per-container rows get
Start/Stop/Restart buttons that disable + show a spinner state during the
in-flight request, matching the existing GCP power-button UX. 5s polling
continues to refresh whichever section is visible.
