const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

// Runs on the same machine as the containers -- no SSH needed, same pattern
// as oracle-status.js. Oracle's spec doesn't change (no start/stop lifecycle
// like GCP), so "hardware" here is just the current live reading.
async function getHardwareUsage() {
  const [cpuOut, memOut, diskOut] = await Promise.all([
    execFileAsync('nproc', []),
    execFileAsync('free', ['-m']),
    execFileAsync('df', ['-h', '/']),
  ])

  const cpus = Number(cpuOut.stdout.trim()) || null

  const memLine = memOut.stdout.split('\n').find((l) => l.startsWith('Mem:'))
  const memParts = memLine ? memLine.trim().split(/\s+/) : []
  const memTotalMb = memParts[1] ? Number(memParts[1]) : null
  const memUsedMb = memParts[2] ? Number(memParts[2]) : null

  const diskLine = diskOut.stdout.split('\n')[1]
  const diskParts = diskLine ? diskLine.trim().split(/\s+/) : []

  return {
    cpus,
    memTotalMb,
    memUsedMb,
    diskTotal: diskParts[1] || null,
    diskUsed: diskParts[2] || null,
    diskPct: diskParts[4] || null,
  }
}

module.exports = { getHardwareUsage }
