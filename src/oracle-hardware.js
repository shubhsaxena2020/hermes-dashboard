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
//
// CPU/memory/uptime/load are read from Node's `os` module (no external
// binaries needed -- robust on minimal images that lack `free`/`nproc`). Disk
// is the one thing `os` can't provide, so we still shell out to `df`, but that
// single call is guarded so a missing `df` degrades to null disk fields
// instead of taking down the whole hardware payload.
async function getHardwareUsage() {
  const cpuUsagePct = await sampleCpuUsage()

  const totalMemBytes = os.totalmem()
  const freeMemBytes = os.freemem()
  const memTotalMb = Math.round(totalMemBytes / (1024 * 1024))
  // `free` reports used = total - free - buffers/cache; approximate with
  // total - free, which is what the panel cares about for the usage bar.
  const memUsedMb = Math.round((totalMemBytes - freeMemBytes) / (1024 * 1024))

  const load = os.loadavg()
  const loadAvg = {
    one: Number(load[0].toFixed(2)),
    five: Number(load[1].toFixed(2)),
    fifteen: Number(load[2].toFixed(2)),
  }

  let diskTotal = null
  let diskUsed = null
  let diskPct = null
  try {
    const { stdout } = await execFileAsync('df', ['-h', '/'])
    const diskLine = stdout.split('\n')[1]
    const diskParts = diskLine ? diskLine.trim().split(/\s+/) : []
    diskTotal = diskParts[1] || null
    diskUsed = diskParts[2] || null
    diskPct = diskParts[4] || null
  } catch {
    // df unavailable -- disk fields stay null, the rest of the payload is fine.
  }

  return {
    cpus: os.cpus().length || null,
    cpuUsagePct,
    memTotalMb,
    memUsedMb,
    diskTotal,
    diskUsed,
    diskPct,
    uptimeSeconds: Math.floor(os.uptime()),
    loadAvg,
  }
}

module.exports = { getHardwareUsage }
