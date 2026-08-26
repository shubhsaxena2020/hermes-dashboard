const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)
const { createCache } = require('./cache')

// Reports the contents of a web/asset root directory with per-entry sizes via
// `du`. Useful as the backend behind the File Manager panel. The root is
// configurable (FILES_ROOT) and defaults to a common location; if it doesn't
// exist we return an empty listing rather than erroring.
const FILES_ROOT = process.env.FILES_ROOT || '/srv/www'
const CACHE_MS = 30 * 1000
const EMPTY = { root: FILES_ROOT, entries: [] }
const get = createCache(CACHE_MS, EMPTY)

async function getFiles() {
  return get(async () => {
    const { stdout } = await execFileAsync('du', ['-sh', '--max-depth=1', FILES_ROOT])
    const entries = stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [size, p] = line.split('\t')
        const name = p === FILES_ROOT ? '/' : p.replace(FILES_ROOT, '')
        return { name: name || '/', size: size.trim(), path: p }
      })
      .filter((e) => e.name !== '/') // the root itself
    return { root: FILES_ROOT, entries }
  })
}

module.exports = { getFiles, FILES_ROOT }
