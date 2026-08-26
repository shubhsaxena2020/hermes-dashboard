require('dotenv').config()
const path = require('path')
const express = require('express')
const basicAuth = require('express-basic-auth')

const oracleStatus = require('./oracle-status')
const oracleDocker = require('./oracle-docker-control')
const oracleHardware = require('./oracle-hardware')
const firecrawlRelay = require('./firecrawl-relay')
const tlsStatus = require('./tls-status')
const costEstimate = require('./cost-estimate')
const domains = require('./domains')
const git = require('./git')
const files = require('./files')
const backups = require('./backups')
const databases = require('./databases')
const traffic = require('./traffic')
const { getVersion } = require('./version')

// Merge a {cpu, mem} stats map onto a container list in place -- shared by
// both Oracle and GCP status assembly.
function mergeStats(containers, stats) {
  return containers.map((c) => ({ ...c, ...(stats[c.name] || {}) }))
}

const app = express()
const PORT = process.env.PORT || 4000

// Mounted before the dashboard's basicAuth below -- firecrawl.shubhbuilds.com
// carries its own Bearer-token auth (see firecrawl-relay.js) and must never
// reach the Basic-auth challenge, which would consume the same Authorization
// header the Bearer token needs.
app.use((req, res, next) => {
  if (req.headers.host === 'firecrawl.shubhbuilds.com') {
    return firecrawlRelay.handleRelay(req, res)
  }
  next()
})

app.use(
  basicAuth({
    users: { [process.env.DASHBOARD_USER]: process.env.DASHBOARD_PASSWORD },
    challenge: true,
    realm: 'vps-control',
  }),
)
const webDist = path.join(__dirname, '..', 'web', 'dist')
app.use(express.static(webDist))
app.use(express.json())

app.get('/api/status', async (req, res) => {
  try {
    const [oracleContainersRaw, oracleStats, oracleUsage, tls, ownMachineType, trafficBytes] = await Promise.all([
      oracleStatus.getOracleContainerHealth().catch((err) => ({ error: err.message })),
      oracleStatus.getOracleContainerStats().catch(() => ({})),
      oracleHardware.getHardwareUsage().catch(() => null),
      tlsStatus.getTlsStatus().catch(() => []),
      costEstimate.getOwnMachineType().catch(() => null),
      traffic.getNetTrafficBytes().catch(() => null),
    ])

    const oracleContainers = Array.isArray(oracleContainersRaw)
      ? mergeStats(oracleContainersRaw, oracleStats)
      : oracleContainersRaw

    const result = {
      oracle: {
        containers: oracleContainers,
        controllable: oracleDocker.CONTROLLABLE_CONTAINERS,
        viewable: oracleStatus.VIEWABLE_CONTAINERS,
        usage: oracleUsage,
      },
      tls,
      costs: {
        main: {
          machineType: ownMachineType,
          monthlyEstimate: costEstimate.monthlyEstimate(ownMachineType),
          alwaysOn: true,
        },
      },
      traffic: {
        usedBytes: trafficBytes,
        // Limit is null => "Unlimited" in the UI. Set a number here if the host
        // has a bandwidth cap (e.g. trafficMonthlyGb * GB).
        limitBytes: null,
        resetLabel: 'Resets on the 1st',
      },
      // Plan/subscription summary for the right rail. Static-ish today; swap
      // for a config source when billing data becomes available.
      subscription: {
        planName: 'Web Host Pro',
        renewalDate: '2026-09-01',
        systemIp: process.env.SYSTEM_IP || null,
        phpVersion: '8.3',
        osLabel: 'Ubuntu 22.04 LTS',
      },
    }

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/oracle/containers/:name/:action', async (req, res) => {
  try {
    await oracleDocker.controlContainer(req.params.name, req.params.action)
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/oracle/containers/:name/logs', async (req, res) => {
  try {
    const logs = await oracleStatus.getOracleContainerLogs(req.params.name)
    res.json({ logs })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/domains', async (req, res) => {
  try {
    const list = await domains.getDomains()
    res.json({ domains: list })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/git', async (req, res) => {
  try {
    res.json({ repos: await git.getGitRepos() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/files', async (req, res) => {
  try {
    res.json(await files.getFiles())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/backups', async (req, res) => {
  try {
    res.json(await backups.getBackups())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/databases', async (req, res) => {
  try {
    res.json(await databases.getDatabases())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/version', (req, res) => {
  res.json(getVersion())
})

app.listen(PORT, () => {
  console.log(`vps-control listening on port ${PORT}`)
})
