#!/usr/bin/env bash
set -e
cd /home/ubuntu/hermes-dashboard-work/web

echo "=== BUILD ==="
npm run build > /tmp/vb.log 2>&1 && echo "BUILD PASS" || { echo "BUILD FAIL"; tail -20 /tmp/vb.log; exit 1; }

echo "=== LINT ==="
npm run lint > /tmp/vl.log 2>&1
echo "lint exit: $?"

echo "=== TESTS ==="
npm run test > /tmp/vt.log 2>&1 && echo "TESTS PASS" || { echo "TESTS FAIL"; tail -20 /tmp/vt.log; exit 1; }
grep -E "Test Files|Tests " /tmp/vt.log | tail -2

echo "=== BUNDLE CONTAINS EDITS ==="
grep -rlF "Quick actions for" dist/assets/*.js >/dev/null && echo "per-domain quick actions: PRESENT" || echo "MISSING"
grep -rlF "No domains yet" dist/assets/*.js >/dev/null && echo "empty state: PRESENT" || echo "empty state MISSING"

echo "=== REAL BROWSER RENDER (light + dark) ==="
export LD_LIBRARY_PATH=/tmp/chrome-libs/usr/lib/x86_64-linux-gnu:/tmp/chrome-libs/usr/lib:/tmp/chrome-libs/lib/x86_64-linux-gnu
node ./scripts/shot.mjs 2>&1 | tail -4

echo "=== QUANTIFY DARK MODE (content area should be dark, not light) ==="
python3 - << 'PY'
from PIL import Image
def reg(img,x0,y0,x1,y1):
    c=img.crop((x0,y0,x1,y1)); px=list(c.getdata()); n=len(px)
    return (sum(p[0] for p in px)//n, sum(p[1] for p in px)//n, sum(p[2] for p in px)//n)
light=Image.open('/home/ubuntu/_render_domains.png').convert('RGB')
dark=Image.open('/home/ubuntu/_render_domains_dark.png').convert('RGB')
print("content  light:", reg(light,300,300,700,360), " dark:", reg(dark,300,300,700,360))
PY
