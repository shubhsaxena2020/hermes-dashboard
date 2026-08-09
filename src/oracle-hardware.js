const os = require('os')
const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

// Sample instantaneous CPU usage by comparing two os.cpus() snapshots 500 ms
// apart. Returns a percentage (0-100) or null on failure.
function sampleCpuUsage() {
  return new Promise((resolve) => {
    const snap1 = os.cpus()
    setTimeout(() => {
      try {
        const snap2 = os.cpus()
        let idle = 0
        let total = 0
        for (let i = 0; i < snap1.length; i++) {
          const d = snap2[i].times
          const e = snap1[i].times
          const idleDelta = d.idle - e.idle
          const totalDelta =
            (d.user - e.user) +
            (d.nice - e.nice) +
            (d.sys - e.sys) +
            idleDelta +
            (d.irq - e.irq)
          idle += idleDelta
          total += totalDelta
        }
        resolve(total > 0 ? Math.round(((total - idle) / total) * 100) : null)
      } catch {
        resolve(null)
      }
    }, 500)
  })
}

// Runs on the same machine as the containers -- no SSH needed, same pattern
// as oracle-status.js. Oracle's spec doesn't change (no start/stop lifecycle
// like GCP), so "hardware" here is just the current live reading.
async function getHardwareUsage() {
  const [cpuOut, memOut, diskOut, cpuUsagePct] = await Promise.all([
    execFileAsync('nproc', []),
    execFileAsync('free', ['-m']),
    execFileAsync('df', ['-h', '/']),
    sampleCpuUsage(),
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
    cpuUsagePct,
    memTotalMb,
    memUsedMb,
    diskTotal: diskParts[1] || null,
    diskUsed: diskParts[2] || null,
    diskPct: diskParts[4] || null,
  }
}

module.exports = { getHardwareUsage }
