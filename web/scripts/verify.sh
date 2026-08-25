#!/usr/bin/env bash
set -e
cd /home/ubuntu/hermes-dashboard-work/web

echo "=== BUILD ==="
npm run build > /tmp/vb.log 2>&1 && echo "BUILD PASS" || { echo "BUILD FAIL"; tail -20 /tmp/vb.log; exit 1; }

echo "=== LINT ==="
npm run lint > /tmp/vl.log 2>&1
echo "lint exit: $?"
echo "real lint errors (rule lines starting with !): $(grep -cE '^\s+!' /tmp/vl.log)"

echo "=== TESTS ==="
npm run test > /tmp/vt.log 2>&1 && echo "TESTS PASS" || { echo "TESTS FAIL"; tail -20 /tmp/vt.log; exit 1; }
grep -E "Test Files|Tests " /tmp/vt.log | tail -2

echo "=== BUNDLE CONTAINS MY EDITS ==="
grep -rlF "Quick actions for" dist/assets/*.js >/dev/null && echo "per-domain quick actions: PRESENT" || echo "MISSING"

echo "=== REAL BROWSER RENDER+DIFF ==="
export LD_LIBRARY_PATH=/tmp/chrome-libs/usr/lib/x86_64-linux-gnu:/tmp/chrome-libs/usr/lib:/tmp/chrome-libs/lib/x86_64-linux-gnu
node ./scripts/shot.mjs 2>&1 | tail -2
python3 /tmp/diff.py 2>&1 | grep -E "mean abs diff"
