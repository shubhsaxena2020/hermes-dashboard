const fs = require('fs')
const path = require('path')
const { createCache } = require('./cache')

// Lists backup artifacts under a configurable directory (BACKUP_ROOT). The
// dashboard can't know your backup tool's internals, so this just surfaces the
// files present (rsync/restic/tar outputs land here). Returns newest-first.
const BACKUP_ROOT = process.env.BACKUP_ROOT || '/var/backups'
const CACHE_MS = 60 * 1000
const EMPTY = { root: BACKUP_ROOT, backups: [] }
const get = createCache(CACHE_MS, EMPTY)

function getBackups() {
  return get(() => {
    const files = fs
      .readdirSync(BACKUP_ROOT, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => {
        const st = fs.statSync(path.join(BACKUP_ROOT, e.name))
        return { name: e.name, sizeBytes: st.size, modifiedAt: st.mtimeMs }
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
    return { root: BACKUP_ROOT, backups: files }
  })
}

module.exports = { getBackups, BACKUP_ROOT }
