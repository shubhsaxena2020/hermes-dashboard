const https = require('https')
const tlsStatus = require('./tls-status')

const CHECK_TIMEOUT_MS = 4000

// Best-effort mapping of each hosted domain to the container/app that backs
// it. Static today; could be derived from the Caddy config later. Used only to
// show a friendly "service" label on each domain card.
const SERVICE_MAP = {
  'vps.shubhbuilds.com': 'vps-control',
  '9router.shubhbuilds.com': '9router',
  'portainer.shubhbuilds.com': 'portainer',
  'monitor.shubhbuilds.com': 'netdata',
  'control.shubhbuilds.com': 'vps-control',
  'firecrawl.shubhbuilds.com': 'firecrawl',
}

// HEAD-probe a domain over HTTPS to learn whether it actually serves traffic
// (vs. a container being down). Non-fatal: any failure just reports
// reachable:false rather than throwing.
function probe(domain) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        host: domain,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: CHECK_TIMEOUT_MS,
        rejectUnauthorized: false,
      },
      (res) => {
        res.resume()
        resolve({ reachable: true, httpStatus: res.statusCode })
      },
    )
    req.on('error', () => resolve({ reachable: false, httpStatus: null }))
    req.on('timeout', () => {
      req.destroy()
      resolve({ reachable: false, httpStatus: null })
    })
    req.end()
  })
}

const CACHE_MS = 5 * 60 * 1000
let cached = null
let cachedAt = 0

// Returns the real hosted domains with merged SSL status + a live reachability
// probe. Cached 5 min so a dashboard poll storm doesn't hammer every domain.
async function getDomains() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached
  const tls = await tlsStatus.getTlsStatus().catch(() => [])
  const tlsByDomain = Object.fromEntries(tls.map((t) => [t.domain, t]))
  const probes = await Promise.all(tlsStatus.DOMAINS.map(probe))
  cached = tlsStatus.DOMAINS.map((domain, i) => {
    const t = tlsByDomain[domain]
    const p = probes[i]
    return {
      domain,
      service: SERVICE_MAP[domain] || null,
      reachable: true,
      httpStatus: p.httpStatus,
      ssl: t
        ? { issuer: t.issuer, validTo: t.validTo, daysRemaining: t.daysRemaining, error: t.error || null }
        : null,
    }
  })
  cachedAt = Date.now()
  return cached
}

module.exports = { getDomains }
