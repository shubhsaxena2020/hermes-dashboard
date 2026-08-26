const tlsStatus = require('./tls-status')

// Canonical SSL/TLS certificate roster, exposed as its own endpoint so the
// SSL/TLS panel can refresh independently of the heavier /api/status payload.
// Reuses tls-status's cached cert checks -- no extra TLS handshakes.
async function getSsl() {
  const certs = await tlsStatus.getTlsStatus()
  return { certs }
}

module.exports = { getSsl }
