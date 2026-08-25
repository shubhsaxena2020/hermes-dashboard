const fs = require('fs')

// Best-effort external network traffic (rx+tx) for all interfaces, read from
// /proc/net/dev so it works without extra tooling. Returns a Promise that
// resolves to a byte count, or null if we can't determine it. Returning a
// Promise (rather than a value) keeps it consistent with the other
// `getX().catch(...)` calls in server.js.
function getNetTrafficBytes() {
  return new Promise((resolve) => {
    try {
      const raw = fs.readFileSync('/proc/net/dev', 'utf8')
      let total = 0
      for (const line of raw.split('\n')) {
        const idx = line.indexOf(':')
        if (idx === -1) continue
        const cols = line.slice(idx + 1).trim().split(/\s+/)
        const rx = Number(cols[0])
        const tx = Number(cols[8])
        if (!Number.isNaN(rx)) total += rx
        if (!Number.isNaN(tx)) total += tx
      }
      resolve(total > 0 ? total : null)
    } catch {
      resolve(null)
    }
  })
}

module.exports = { getNetTrafficBytes }
