# iter-87 — Extract TLS summary badge logic into testable pure function

## Objective ID

**iter-87**

## Problem

`OverviewSection.tsx` lines 84–97 contain a 13-line IIFE that computes TLS
certificate summary statistics (errored / expiring-soon / healthy counts,
label string, and badge variant) and renders a `<Badge>` inline in JSX.
This logic is:

- **Untested** — no unit tests cover the label/variant branching.
- **Hard to read** — the IIFE mixes computation and rendering in the JSX
  return, making it difficult to review in isolation.
- **Inconsistent with project conventions** — `resourceBadgeInfo` and
  `certBadgeVariant` were already extracted to `lib/badge-utils.ts`
  (iter-99) with unit tests. This TLS summary computation follows the
  same destructive/secondary/outline pattern but lives inline.

The extracted function will have JSDoc documentation and 5 deterministic
unit tests, directly addressing:
- **REG-74-maintainability** (-3.0) — complex inline logic extracted to
  a named, documented function
- **REG-85-documentation** (-3.0) — JSDoc + test file document the
  behavior of the TLS summary computation

## Files Likely Touched

| File | Change |
|------|--------|
| `web/src/lib/badge-utils.ts` | **Add** `tlsSummaryBadge(certs)` function with JSDoc |
| `web/src/__tests__/badge-utils.test.ts` | **Add** 5 test cases for `tlsSummaryBadge` |
| `web/src/components/OverviewSection.tsx` | **Replace** IIFE (lines 84–97) with function call; remove unused `TLS_EXPIRING_SOON_DAYS` import |

## Exact Steps

### Step 1: Add `tlsSummaryBadge` to `web/src/lib/badge-utils.ts`

Append the following function after `certBadgeVariant`. Requires adding
`TlsCertStatus` to the existing import from `@/lib/api`.

New import line (replace existing):
```typescript
import type { BadgeVariant, TlsCertStatus } from '@/lib/api'
```

New function (append after `certBadgeVariant`):
```typescript
/**
 * Compute a summary badge for a set of TLS certificates.
 *
 * Returns null when the array is empty (no badge rendered).
 * Label shows "N error(s)" when any cert has an error,
 * "X OK · Y expiring" when certs are expiring soon, or
 * "X/Y OK" when all certs are healthy.
 */
export function tlsSummaryBadge(
  certs: TlsCertStatus[],
): { label: string; variant: BadgeVariant } | null {
  if (certs.length === 0) return null
  const errored = certs.filter((c) => c.error).length
  const expiringSoon = certs.filter(
    (c) => !c.error && (c.daysRemaining ?? Infinity) < TLS_EXPIRING_SOON_DAYS,
  ).length
  const healthy = certs.length - errored - expiringSoon
  const label =
    errored > 0
      ? `${errored} error${errored > 1 ? 's' : ''}`
      : expiringSoon > 0
        ? `${healthy} OK · ${expiringSoon} expiring`
        : `${healthy}/${certs.length} OK`
  const variant =
    errored > 0 ? 'destructive' : expiringSoon > 0 ? 'secondary' : 'outline'
  return { label, variant }
}
```

### Step 2: Add 5 test cases to `web/src/__tests__/badge-utils.test.ts`

Add a new `describe('tlsSummaryBadge', ...)` block at the end of the file.
Import `tlsSummaryBadge` from the existing import line (add to the named
import).

```typescript
import { resourceBadgeInfo, certBadgeVariant, tlsSummaryBadge } from '@/lib/badge-utils'
```

New describe block:
```typescript
describe('tlsSummaryBadge', () => {
  it('returns null for an empty cert array', () => {
    expect(tlsSummaryBadge([])).toBeNull()
  })

  it('returns outline with full count when all certs are healthy', () => {
    const certs = [
      { domain: 'a.example.com', daysRemaining: 60 },
      { domain: 'b.example.com', daysRemaining: 45 },
      { domain: 'c.example.com', daysRemaining: 90 },
    ]
    expect(tlsSummaryBadge(certs)).toEqual({
      label: '3/3 OK',
      variant: 'outline',
    })
  })

  it('returns destructive with error count when any cert has an error', () => {
    const certs = [
      { domain: 'a.example.com', error: 'connection refused' },
      { domain: 'b.example.com', daysRemaining: 45 },
    ]
    expect(tlsSummaryBadge(certs)).toEqual({
      label: '1 error',
      variant: 'destructive',
    })
  })

  it('returns destructive with plural error count for multiple errors', () => {
    const certs = [
      { domain: 'a.example.com', error: 'timeout' },
      { domain: 'b.example.com', error: 'refused' },
    ]
    expect(tlsSummaryBadge(certs)).toEqual({
      label: '2 errors',
      variant: 'destructive',
    })
  })

  it('returns secondary with expiring count when certs are expiring soon', () => {
    const certs = [
      { domain: 'a.example.com', daysRemaining: 60 },
      { domain: 'b.example.com', daysRemaining: 45 },
      { domain: 'c.example.com', daysRemaining: 10 },
    ]
    expect(tlsSummaryBadge(certs)).toEqual({
      label: '2 OK · 1 expiring',
      variant: 'secondary',
    })
  })
})
```

### Step 3: Simplify `OverviewSection.tsx` header section

Replace lines 1 (import) and 84–97 (IIFE) with:

**Import changes:**
- Remove `TLS_EXPIRING_SOON_DAYS` from the import (no longer used here)
- Add `tlsSummaryBadge` to the existing `badge-utils` import

Before:
```typescript
import { TLS_EXPIRING_SOON_DAYS } from '@/lib/color-threshold'
// ...
import { certBadgeVariant } from '@/lib/badge-utils'
```

After:
```typescript
// (TLS_EXPIRING_SOON_DAYS import removed entirely)
// ...
import { certBadgeVariant, tlsSummaryBadge } from '@/lib/badge-utils'
```

**JSX replacement (lines 84–97):**

Before:
```tsx
{(() => {
  const certs = data.tls || []
  const errored = certs.filter((c) => c.error).length
  const expiringSoon = certs.filter((c) => !c.error && (c.daysRemaining ?? Infinity) < TLS_EXPIRING_SOON_DAYS).length
  const healthy = certs.length - errored - expiringSoon
  if (certs.length === 0) return null
  const label = errored > 0
    ? `${errored} error${errored > 1 ? 's' : ''}`
    : expiringSoon > 0
      ? `${healthy} OK · ${expiringSoon} expiring`
      : `${healthy}/${certs.length} OK`
  const variant = errored > 0 ? 'destructive' : expiringSoon > 0 ? 'secondary' : 'outline'
  return <Badge variant={variant}>{label}</Badge>
})()}
```

After:
```tsx
{(() => {
  const summary = tlsSummaryBadge(data.tls || [])
  return summary && <Badge variant={summary.variant}>{summary.label}</Badge>
})()}
```

## Verification Commands

```bash
# 1. TypeScript build — must exit 0
cd /data/worktree/web && npx tsc -b

# 2. Unit tests — badge-utils tests must all pass (expect 10+ tests now)
cd /data/worktree/web && npx vitest run web/src/__tests__/badge-utils.test.ts

# 3. Lint — no new warnings in modified files
cd /data/worktree/web && npx oxlint web/src/components/OverviewSection.tsx web/src/lib/badge-utils.ts

# 4. Full test suite — all 32+ tests must pass
cd /data/worktree/web && npx vitest run
```

All four must pass before claiming the change is verified.

## Rollback Notes

```bash
git checkout HEAD~1 -- \
  web/src/lib/badge-utils.ts \
  web/src/__tests__/badge-utils.test.ts \
  web/src/components/OverviewSection.tsx
```

Clean single-commit revert — no partial rollback risk. No new files
to delete (only modifications to existing files).

## Risk Notes

- **Zero behavior change**: the extracted function is a verbatim copy of
  the IIFE logic. The only change is where the computation lives.
- **No new dependencies**: pure addition to existing utility module.
- **Threshold alignment**: uses `TLS_EXPIRING_SOON_DAYS` from the same
  `color-threshold.ts` module already imported by `badge-utils.ts`.
- **Accessibility unchanged**: the rendered `<Badge>` element is identical.
- **Performance unchanged**: pure function called during render, O(n)
  where n = number of certs (typically 3–8). No new DOM, no new network
  calls, no bundle size increase (net negative — extracted code replaces
  inline code).
