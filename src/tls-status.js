const tls = require('tls')

// Every public-facing domain this dashboard's own Caddy instance terminates
// TLS for -- kept as a plain list rather than derived from the Caddyfile
// since that file isn't readable from inside this container.
const DOMAINS = [
  'vps.shubhbuilds.com',
  '9router.shubhbuilds.com',
  'portainer.shubhbuilds.com',
  'monitor.shubhbuilds.com',
  'control.shubhbuilds.com',
  'firecrawl.shubhbuilds.com',
]

const CHECK_TIMEOUT_MS = 5000

function checkOne(domain) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: domain, port: 443, servername: domain, timeout: CHECK_TIMEOUT_MS },
      () => {
        const cert = socket.getPeerCertificate()
        socket.end()
        if (!cert || !cert.valid_to) {
          resolve({ domain, error: 'No certificate presented' })
          return
        }
        const validTo = new Date(cert.valid_to)
        const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        resolve({
          domain,
          issuer: cert.issuer?.O || cert.issuer?.CN || 'unknown',
          validTo: validTo.toISOString(),
          daysRemaining,
        })
      },
    )
    socket.on('error', (err) => resolve({ domain, error: err.message }))
    socket.on('timeout', () => {
      socket.destroy()
      resolve({ domain, error: 'Connection timed out' })
    })
  })
}

// Certs are renewed by Caddy roughly every ~60 days of a 90-day lifetime --
// checking on every 5s dashboard poll would just be 6 needless TLS handshakes
// per poll. Cache for an hour; that's still fast enough to notice a real
// renewal failure well before it becomes urgent.
const CACHE_MS = 60 * 60 * 1000
let cached = null
let cachedAt = 0

async function getTlsStatus() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached
  cached = await Promise.all(DOMAINS.map(checkOne))
  cachedAt = Date.now()
  return cached
}

module.exports = { getTlsStatus, DOMAINS }

