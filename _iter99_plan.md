# iter-99 — Extract shared badge utility + add vitest unit tests

## Objective ID

**iter-99**

## Problem

Two pure functions that compute Badge variant + label from threshold logic are
duplicated across components:

- `resourceBadgeInfo(cpuPct, memPct)` in ContainerTable.tsx (line 72)
- `certBadgeVariant(daysRemaining)` in OverviewSection.tsx (line 10)

Both are private, untested, and follow the same destructive/secondary/outline
pattern. The project has zero unit tests and no test framework installed.
Prior iter-99 was REJECTED by architecture (wrong files) and testability
(no tests) reviewers. This plan addresses all reviewer feedback.

## Files Likely Touched

| File | Change |
|------|--------|
| `web/src/lib/badge-utils.ts` | **NEW** — extracted `resourceBadgeInfo` + `certBadgeVariant` |
| `web/src/components/ContainerTable.tsx` | Remove local `resourceBadgeInfo` (lines 72-94), add import from `@/lib/badge-utils` |
| `web/src/components/OverviewSection.tsx` | Remove local `certBadgeVariant` (lines 10-15), add import from `@/lib/badge-utils` |
| `web/src/__tests__/badge-utils.test.ts` | **NEW** — 8 unit tests for both functions |
| `web/package.json` | Add `vitest` devDependency, add `"test"` script |
| `README.md` | Add iter-99 changelog entry |

## Exact Steps

### Step 1: Create `web/src/lib/badge-utils.ts`

Extract both functions into a single shared module. No logic changes — exact
copy of the existing implementations.

```typescript
import type { BadgeVariant } from '@/lib/api'
import { TLS_CRITICAL_DAYS, TLS_EXPIRING_SOON_DAYS } from '@/lib/color-threshold'

/** Per-container resource badge: high (≥80%) or elevated (≥60%). */
export function resourceBadgeInfo(
  cpuPct: number | null,
  memPct: number | null,
): { variant: BadgeVariant; label: string } | null {
  const cpuHigh = cpuPct != null && cpuPct >= 80
  const memHigh = memPct != null && memPct >= 80
  const cpuElev = cpuPct != null && cpuPct >= 60
  const memElev = memPct != null && memPct >= 60

  if (cpuHigh || memHigh) {
    const parts = []
    if (cpuHigh) parts.push('CPU')
    if (memHigh) parts.push('MEM')
    return { variant: 'destructive', label: `${parts.join('+')} high` }
  }
  if (cpuElev || memElev) {
    const parts = []
    if (cpuElev) parts.push('CPU')
    if (memElev) parts.push('MEM')
    return { variant: 'secondary', label: `${parts.join('+')} elevated` }
  }
  return null
}

/** TLS cert badge variant from days remaining. */
export function certBadgeVariant(daysRemaining?: number): BadgeVariant {
  if (daysRemaining == null) return 'destructive'
  if (daysRemaining < TLS_CRITICAL_DAYS) return 'destructive'
  if (daysRemaining < TLS_EXPIRING_SOON_DAYS) return 'secondary'
  return 'outline'
}
```

### Step 2: Update `ContainerTable.tsx`

- Remove lines 72-94 (the local `resourceBadgeInfo` function).
- Add import: `import { resourceBadgeInfo } from '@/lib/badge-utils'`
- No other changes — the call site at line 241 stays identical.

### Step 3: Update `OverviewSection.tsx`

- Remove lines 10-15 (the local `certBadgeVariant` function).
- Add import: `import { certBadgeVariant } from '@/lib/badge-utils'`
- No other changes — the call site at line 146 stays identical.

### Step 4: Install vitest and add test script

```bash
cd /data/worktree/web
npm install -D vitest
```

Add to `web/package.json` scripts:
```json
"test": "vitest run"
```

### Step 5: Create `web/src/__tests__/badge-utils.test.ts`

8 deterministic test cases:

1. `resourceBadgeInfo` — both CPU and MEM ≥80% → destructive, label /high/
2. `resourceBadgeInfo` — only CPU ≥80% → destructive, label /CPU high/
3. `resourceBadgeInfo` — CPU ≥60% but <80% → secondary, label /elevated/
4. `resourceBadgeInfo` — both null → null
5. `certBadgeVariant` — 10 days remaining → destructive
6. `certBadgeVariant` — 20 days remaining → secondary
7. `certBadgeVariant` — 45 days remaining → outline
8. `certBadgeVariant` — undefined → destructive

### Step 6: Update README.md changelog

Add after the iter-98 entry:
```
- **iter-99** — Badge utility extraction: moved `resourceBadgeInfo` (ContainerTable) and `certBadgeVariant` (OverviewSection) into shared `lib/badge-utils.ts`, eliminating duplicated threshold logic. Added vitest and 8 unit tests covering all threshold branches.
```

## Verification Commands

```bash
# 1. TypeScript build — must exit 0
cd /data/worktree/web && npm run build

# 2. Unit tests — must pass 8/8
cd /data/worktree/web && npm test

# 3. Server smoke test — must start and respond with 401 (auth)
cd /data/worktree && timeout 5 node src/server.js &
sleep 2 && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/ ; kill %1 2>/dev/null
```

All three must pass before claiming the change is verified.

## Rollback Notes

```bash
git checkout HEAD~1 -- \
  web/src/lib/badge-utils.ts \
  web/src/components/ContainerTable.tsx \
  web/src/components/OverviewSection.tsx \
  web/src/__tests__/badge-utils.test.ts \
  web/package.json \
  web/package-lock.json \
  README.md
```

Then `cd web && npm install` to restore the lock file.
Clean single-commit revert — no partial rollback risk.

## Risk Notes

- **Zero logic change**: both functions are exact copies of the originals.
  The only difference is import path. If the extracted functions return
  different values, every existing test case would catch it.
- **No new dependencies at runtime**: vitest is devDependency only, not
  bundled into the production build.
- **Threshold alignment**: `resourceBadgeInfo` uses 80%/60% matching
  `progressIndicatorClass` in color-threshold.ts. `certBadgeVariant` uses
  `TLS_CRITICAL_DAYS`/`TLS_EXPIRING_SOON_DAYS` from the same module.
  Both imports reinforce the single-source-of-truth for thresholds.
- **Accessibility unchanged**: no new DOM elements, no attribute changes,
  no interaction changes. Badge rendering is identical.
- **Performance unchanged**: pure functions called during render, O(1).
  No new dependencies, no new network calls, no bundle size increase
  (net negative — shared import replaces duplicated code).
