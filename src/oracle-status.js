const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

// Runs on the same machine as the containers -- no SSH needed.
async function getOracleContainerHealth() {
  const { stdout } = await execFileAsync('docker', [
    'ps', '-a', '--format', '{{.Names}}|{{.Status}}',
  ])
  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, status] = line.split('|')
      return { name, status, up: status.startsWith('Up') }
    })
}

// Per-container CPU/memory, keyed by container name. Best-effort merge target
// for getOracleContainerHealth's list -- a container with no matching stats
// entry (e.g. just restarted) simply won't have cpu/mem fields.
async function getOracleContainerStats() {
  const { stdout } = await execFileAsync('docker', [
    'stats', '--no-stream', '--format', '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}',
  ])
  const stats = {}
  stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      const [name, cpu, mem] = line.split('|')
      stats[name] = { cpu, mem }
    })
  return stats
}

// Every container name this dashboard is allowed to show logs for --
// read-only, so this is deliberately broader than the controllable-actions
// allowlist (includes vps-control itself, useful for debugging the
// dashboard from the dashboard).
const VIEWABLE_CONTAINERS = [
  'vps-control-vps-control-1',
  'postgres',
  'netdata',
  'portainer',
  '9router',
  'placeholder',
  'caddy',
  'firecrawl-api-1',
  'firecrawl-redis-1',
  'firecrawl-rabbitmq-1',
  'firecrawl-playwright-service-1',
  'firecrawl-nuq-postgres-1',
  'firecrawl-foundationdb-1',
  'firecrawl-data-worker-1',
  'firecrawl-searxng-1-1',
  'firecrawl-searxng-2-1',
  'firecrawl-searxng-lb-1',
  'firecrawl-staging-db-1',
  'firecrawl-foundationdb-init-1',
  'paperclip',
]

async function getOracleContainerLogs(name) {
  if (!VIEWABLE_CONTAINERS.includes(name)) {
    throw new Error(`Container "${name}" is not viewable`)
  }
  // Container logs can go to stdout or stderr -- merge both rather than miss half.
  const { stdout, stderr } = await execFileAsync('docker', ['logs', '--tail', '50', name])
  return `${stdout}${stderr}`.trim().split('\n').filter(Boolean)
}

module.exports = { getOracleContainerHealth, getOracleContainerStats, getOracleContainerLogs, VIEWABLE_CONTAINERS }
