const http = require('http')

// On-demand us-central1 list pricing, checked 2026-07-19. Approximate --
// GCP's actual price can drift and sustained-use/committed discounts aren't
// modeled here. Good enough for "is this about to cost real money" at a
// glance, not for a billing-accurate figure.
const HOURLY_RATES = {
  'e2-micro': 0, // covered by GCP's Always Free tier
  'e2-small': 0.017,
  'e2-medium': 0.034,
  'e2-standard-2': 0.067,
  'e2-standard-4': 0.134,
  'e2-standard-8': 0.268,
  'e2-highmem-8': 0.3616,
}

function monthlyEstimate(machineType) {
  const hourly = HOURLY_RATES[machineType]
  if (hourly == null) return null
  return Math.round(hourly * 730 * 100) / 100
}

// Asks the GCE metadata server what machine type *this* VM is -- works from
// any GCP instance with zero IAM permissions, unlike calling the Compute API
// about ourselves. Cached: a running instance's machine type never changes
// without a stop/resize/start cycle, not worth re-asking every poll.
let cachedOwnType = null

async function getOwnMachineType() {
  if (cachedOwnType) return cachedOwnType
  const result = await fetchOwnMachineType()
  if (result) cachedOwnType = result
  return result
}

function fetchOwnMachineType() {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: 'metadata.google.internal',
        path: '/computeMetadata/v1/instance/machine-type',
        headers: { 'Metadata-Flavor': 'Google' },
        timeout: 3000,
      },
      (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => resolve(body.split('/').pop() || null))
      },
    )
    req.on('error', () => resolve(null))
    req.on('timeout', () => {
      req.destroy()
      resolve(null)
    })
  })
}

module.exports = { monthlyEstimate, getOwnMachineType, HOURLY_RATES }
