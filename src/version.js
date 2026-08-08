const fs = require('fs')
const path = require('path')

// Written into the deploy tarball at package time (see deploy scripts) --
// not derived from `git` at runtime since the .git directory is deliberately
// excluded from the tarball for a lean transfer.
const VERSION_FILE = path.join(__dirname, '..', 'VERSION')

function getVersion() {
  try {
    const content = fs.readFileSync(VERSION_FILE, 'utf8').trim()
    const [commit, date] = content.split('\n')
    return { commit: commit || null, date: date || null }
  } catch {
    return { commit: null, date: null }
  }
}

module.exports = { getVersion }
