const fs = require('fs')
const path = require('path')

// Lists backup artifacts under a configurable directory (BACKUP_ROOT). The
// dashboard can't know your backup tool's internals, so this just surfaces the
// files present (rsync/restic/tar outputs land here). Returns newest-first.
const BACKUP_ROOT = process.env.BACKUP_ROOT || '/var/backups'
const CACHE_MS = 60 * 1000
let cached = null
let cachedAt = 0

function getBackups() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached
  let files = []
  try {
    files = fs
      .readdirSync(BACKUP_ROOT, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => {
        const st = fs.statSync(path.join(BACKUP_ROOT, e.name))
        return { name: e.name, sizeBytes: st.size, modifiedAt: st.mtimeMs }
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
  } catch {
    files = []
  }
  cached = { root: BACKUP_ROOT, backups: files }
  cachedAt = Date.now()
  return cached
}

module.exports = { getBackups, BACKUP_ROOT }
