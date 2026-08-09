# OBJ-89: Polished Empty State for ContainerTable

## Objective ID
OBJ-89-empty-state

## Problem
ContainerTable has two empty states, both visually bare:

1. **No containers at all** (`containers.length === 0`): the `<Table>` renders with
   headers but **zero rows and no message** — the user sees a ghost table.

2. **Filter yields no matches** (`sorted.length === 0 && nameFilter`): a single
   line of plain text inside a `<TableCell>` — `No containers match "{filter}"` —
   with no icon, no visual weight, no guidance.

Both are invisible UX dead-ends that hurt the visual_design (5) and ux (5) scores.

## Approach
Replace both with a polished, centered empty-state block rendered **outside** the
`<Table>` when there are no rows to show. Use the existing `lucide-react` icon
library (`Container` icon, already in the project's dependency tree) and
`shadcn/ui`-compatible Tailwind patterns.

No new dependencies. No library adoption needed — this is pure component polish.

## Files Touched

| File | Change |
|------|--------|
| `web/src/components/ContainerTable.tsx` | Add empty-state block; conditionally hide `<Table>` when no rows |
| `web/src/__tests__/ContainerTable.empty-state.test.tsx` | New vitest test for both empty states |

## Exact Steps

### Step 1 — Add the `Container` icon import
Add `Container` to the existing `lucide-react` import on line 2 of ContainerTable.tsx:
```
- import { ArrowDown, ArrowUp, Check, Copy, Loader2, RefreshCw } from 'lucide-react'
+ import { ArrowDown, ArrowUp, Check, Container, Copy, Loader2, RefreshCw } from 'lucide-react'
```

### Step 2 — Render empty-state block instead of empty Table
Inside the component's return, between the sort bar (line 208) and the `<Table>`
(line 209), add a conditional that decides what to render:

```tsx
{sorted.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-10 text-center" role="status">
    <Container className="size-10 text-muted-foreground/50 mb-3" aria-hidden="true" />
    <p className="text-sm text-muted-foreground">
      {nameFilter ? (
        <>No containers match &ldquo;{nameFilter}&rdquo;</>
      ) : (
        <>No containers found</>
      )}
    </p>
    {nameFilter && (
      <button
        type="button"
        onClick={() => setNameFilter('')}
        className="mt-2 text-xs text-primary hover:underline"
      >
        Clear filter
      </button>
    )}
  </div>
) : (
  <Table>
    {/* ... existing TableHeader + TableBody (lines 209-404) ... */}
  </Table>
)}
```

This replaces lines 209-405 (`<Table>` through `</Table>`).

Key details:
- The `<div>` gets `role="status"` for screen readers (polite live region, announces
  empty state).
- The icon is decorative (`aria-hidden="true"`) at 40px, muted at 50% opacity to
  feel soft, not alarming.
- The `Container` icon (server/docker container) is semantically appropriate.
- When a filter is active, a "Clear filter" link lets the user reset — a useful UX
  affordance that the old bare text lacked.
- The existing filter-empty-state block (lines 397-403) is removed since the new
  unified block handles both cases.

### Step 3 — Add empty-state test
Create `web/src/__tests__/ContainerTable.empty-state.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContainerTable } from '@/components/ContainerTable'
import type { ContainerInfo } from '@/lib/api'

const noop = vi.fn()

const baseProps = {
  controllable: [],
  onAction: noop,
  onLogs: noop,
}

function renderTable(containers: ContainerInfo[] = [], nameFilter = '') {
  render(
    <ContainerTable
      containers={containers}
      {...baseProps}
    />
  )
  // Simulate typing in the filter input if a filter was provided
  if (nameFilter) {
    const input = screen.getByPlaceholderText('Filter containers…')
    // Use React's native input setter to trigger onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, 'value'
    )!.set!
    nativeInputValueSetter.call(input, nameFilter)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
}
```

Tests:
- `'shows empty-state message when containers array is empty'`
  — render with `[]`, assert `getByRole('status')` exists, text "No containers found"
- `'shows empty-state with clear-filter button when filter yields no matches'`
  — render with one container + type filter text that won't match, assert "No containers match" + "Clear filter" button
- `'does not show empty-state when containers exist'`
  — render with one container, assert `queryByRole('status')` is null
- `'hides table when no containers and no filter'`
  — render with `[]`, assert table role is absent (or use queryByRole)

> **Note:** If `@testing-library/react` is not installed, add it to `devDependencies`
> and `npm install`. Check `package.json` first.

### Step 4 — Remove the now-redundant old filter-empty-state block
Delete lines 397-403 (the `{sorted.length === 0 && nameFilter && ( ... )}` block
inside `<TableBody>`), since the new unified block above handles it.

## Verification Commands

```bash
# 1. TypeScript compilation (catches syntax/type errors)
cd /data/worktree/web && npx tsc --noEmit

# 2. Lint
cd /data/worktree/web && npx oxlint

# 3. All tests (existing + new)
cd /data/worktree/web && npx vitest run

# 4. Build (full production bundle)
cd /data/worktree/web && npm run build

# 5. Visual smoke test — start dev server and check in browser
cd /data/worktree/web && npm run dev
# Navigate to http://localhost:5173, go to VPS section
# - With empty containers array: should see Container icon + "No containers found"
# - With filter typing: should see "No containers match …" + "Clear filter"
```

## Rollback Notes
- Single-component change in ContainerTable.tsx — revert via `git checkout web/src/components/ContainerTable.tsx`
- New test file — `rm web/src/__tests__/ContainerTable.empty-state.test.tsx`
- No dependency changes (unless @testing-library/react needs installing; revert
  `npm uninstall @testing-library/react @testing-library/jest-dom` if so)
- No database, API, or configuration changes

## Risk Notes
- **Very low risk.** Purely additive visual component change with no behavioral
  changes to existing functionality (sort, filter, logs, actions all untouched).
- The `role="status"` on the empty-state div is a polite aria-live region —
  screen readers will announce it when it appears, which is correct UX.
- No new dependencies unless `@testing-library/react` is missing from devDeps
  (check package.json before assuming). The component change itself is zero-dep.
- The empty-state block conditionally hides the `<Table>` entirely, which means
  the table headers also disappear when there are no rows — this is intentional
  and follows standard dashboard patterns (no empty header row).
