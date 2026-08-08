const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

// Every container this dashboard is allowed to start/stop/restart. Deliberately
// excludes vps-control's own container -- restarting itself mid-request serves
// no real purpose and just risks killing the response before it's sent.
const CONTROLLABLE_CONTAINERS = [
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

const ALLOWED_ACTIONS = ['start', 'stop', 'restart']

async function controlContainer(name, action) {
  if (!CONTROLLABLE_CONTAINERS.includes(name)) {
    throw new Error(`Container "${name}" is not in the controllable list`)
  }
  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new Error(`Action "${action}" is not allowed`)
  }
  await execFileAsync('docker', [action, name])
}

module.exports = { controlContainer, CONTROLLABLE_CONTAINERS }
