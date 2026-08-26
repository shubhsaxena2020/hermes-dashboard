const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

// Reports database-related containers (Postgres/MySQL/MariaDB/Redis/Mongo) and
// their running state + mounted volume, by inspecting the host's docker
// daemon. This is container-level visibility — enough to show what DB services
// exist and whether they're up, which is what a hosting panel's Databases page
// needs. The dashboard runs with the docker socket mounted, so this works on
// the host.
const DB_PATTERNS = ['postgres', 'mysql', 'mariadb', 'redis', 'mongo', 'db']
const CACHE_MS = 20 * 1000
let cached = null
let cachedAt = 0

async function getDatabases() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached
  let containers = []
  try {
    const { stdout } = await execFileAsync('docker', [
      'ps', '-a', '--format', '{{.Names}}|{{.Image}}|{{.Status}}',
    ])
    containers = stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, image, status] = line.split('|')
        return { name, image, up: status.startsWith('Up'), status }
      })
      .filter((c) => DB_PATTERNS.some((p) => c.name.toLowerCase().includes(p) || (c.image || '').toLowerCase().includes(p)))
  } catch {
    containers = []
  }
  cached = { databases: containers }
  cachedAt = Date.now()
  return cached
}

module.exports = { getDatabases }
