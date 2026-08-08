const http = require('http')
const { URL } = require('url')
const crypto = require('crypto')

const RELAY_KEY = process.env.FIRECRAWL_RELAY_KEY
const FIRECRAWL_HOST = 'firecrawl-api-1' // sibling container on the shared `proxy` docker network -- vps-control and firecrawl now run on the same box
const FIRECRAWL_PORT = 3002

function proxyRequest(req, res) {
  const target = new URL(req.url, `http://${FIRECRAWL_HOST}:${FIRECRAWL_PORT}`)
  // Firecrawl itself doesn't check auth (USE_DB_AUTHENTICATION=false), but
  // the relay's own Bearer key has no business being forwarded any further
  // than this hop -- drop it rather than pass it upstream unnecessarily.
  const { authorization, ...forwardHeaders } = req.headers
  const proxyReq = http.request(
    {
      host: FIRECRAWL_HOST,
      port: FIRECRAWL_PORT,
      method: req.method,
      path: target.pathname + target.search,
      headers: { ...forwardHeaders, host: `${FIRECRAWL_HOST}:${FIRECRAWL_PORT}` },
      timeout: 120000,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )
  proxyReq.on('error', (err) => {
    if (!res.headersSent) res.status(502).json({ error: `Upstream error: ${err.message}` })
  })
  req.pipe(proxyReq)
}

// Constant-time comparison -- a plain !== is fine against most attackers
// given real-world network jitter, but this is nearly free to do properly.
// Buffers of different lengths are compared against a same-length dummy
// first so timingSafeEqual never throws on a length mismatch (which would
// itself be a length-revealing branch).
function safeEqual(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length))
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

// Own Bearer-token check, deliberately kept separate from (and mounted
// before) the dashboard's basicAuth -- Basic and Bearer can't share one
// Authorization header, same lesson as the earlier Portainer/Caddy conflict.
async function handleRelay(req, res) {
  const auth = req.headers.authorization || ''
  if (!RELAY_KEY || !safeEqual(auth, `Bearer ${RELAY_KEY}`)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    proxyRequest(req, res)
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
}

module.exports = { handleRelay }
