// Shared TTL cache used by the read-only status modules (files, backups,
// databases, traffic, tls-status). The key subtlety: a *successful* result —
// including a legitimately empty one — is cached for the full TTL, but a
// *thrown error* is cached as "negative" for a short TTL so a transient
// failure (docker/du momentarily unavailable) doesn't get masked as "no data"
// for the whole TTL. Without this, the first call after a blip would cache an
// empty result and the UI would show nothing until the cache expired.
function createCache(ttlMs, fallback, negativeTtlMs = 5000) {
  let value = null
  let at = 0
  let negative = false
  return async function get(produce) {
    const age = Date.now() - at
    if (value !== null && !negative && age < ttlMs) return value
    if (negative && age < negativeTtlMs) return value ?? fallback
    try {
      const fresh = await produce()
      value = fresh
      negative = false
      at = Date.now()
      return value
    } catch {
      value = fallback
      negative = true
      at = Date.now()
      return value
    }
  }
}

module.exports = { createCache }
