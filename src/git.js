const { execFile } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const execFileAsync = promisify(execFile)

// Lists local git repositories under a set of scan roots and reports each
// repo's current branch, remote, and working-tree dirtiness. Runs on the host
// (the dashboard container has the filesystem mounted), so it sees real repos.
const SCAN_ROOTS = (process.env.GIT_SCAN_ROOTS || '/home /root').split(/\s+/).filter(Boolean)
const CACHE_MS = 30 * 1000
let cached = null
let cachedAt = 0

function findRepos(root) {
  // Walk up to 5 levels looking for .git directories (avoids deep recursion).
  const results = []
  function walk(dir, depth) {
    if (depth > 5) return
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    if (entries.some((e) => e.name === '.git')) {
      results.push(dir)
      return // don't descend into a repo's subdirs
    }
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        walk(path.join(dir, e.name), depth + 1)
      }
    }
  }
  try {
    walk(root, 0)
  } catch {
    /* unreadable root — skip */
  }
  return results
}

async function describe(repo) {
  try {
    const [branchRes, statusRes, remoteRes] = await Promise.all([
      execFileAsync('git', ['-C', repo, 'rev-parse', '--abbrev-ref', 'HEAD']),
      execFileAsync('git', ['-C', repo, 'status', '--porcelain']),
      execFileAsync('git', ['-C', repo, 'remote', 'get-url', 'origin']).catch(() => ({ stdout: '' })),
    ])
    const branch = branchRes.stdout.trim() || 'unknown'
    const dirty = statusRes.stdout.trim().split('\n').filter(Boolean).length
    const remote = remoteRes.stdout.trim() || null
    return { repo: path.basename(repo), path: repo, branch, remote, dirty }
  } catch {
    return { repo: path.basename(repo), path: repo, branch: 'unknown', remote: null, dirty: 0 }
  }
}

async function getGitRepos() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached
  const repos = SCAN_ROOTS.flatMap((r) => findRepos(r))
  cached = await Promise.all(repos.map(describe))
  cachedAt = Date.now()
  return cached
}

module.exports = { getGitRepos }
