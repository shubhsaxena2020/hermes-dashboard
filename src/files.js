const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

// Reports the contents of a web/asset root directory with per-entry sizes via
// `du`. Useful as the backend behind the File Manager panel. The root is
// configurable (FILES_ROOT) and defaults to a common location; if it doesn't
// exist we return an empty listing rather than erroring.
const FILES_ROOT = process.env.FILES_ROOT || '/srv/www'
const CACHE_MS = 30 * 1000
let cached = null
let cachedAt = 0

async function getFiles() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached
  let entries
  try {
    const { stdout } = await execFileAsync('du', ['-sh', '--max-depth=1', FILES_ROOT])
    entries = stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [size, p] = line.split('\t')
        const name = p === FILES_ROOT ? '/' : p.replace(FILES_ROOT, '')
        return { name: name || '/', size: size.trim(), path: p }
      })
      .filter((e) => e.name !== '/') // the root itself
  } catch {
    entries = []
  }
  cached = { root: FILES_ROOT, entries }
  cachedAt = Date.now()
  return cached
}

module.exports = { getFiles, FILES_ROOT }
