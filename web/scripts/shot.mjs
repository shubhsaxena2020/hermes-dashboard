import { chromium } from 'playwright'
import http from 'http'
import fs from 'fs'
import path from 'path'

const ROOT = '/home/ubuntu/hermes-dashboard-work/web/dist'
const MOCK = '/home/ubuntu/hermes-dashboard-work/web/src/lib/mock-data.ts'
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.woff2':'font/woff2', '.svg':'image/svg+xml', '.json':'application/json' }

// Inject VITE_MOCK so api.status() returns the deterministic dataset.
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0])
  if (p === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
    return
  }
  const fp = path.join(ROOT, p)
  fs.readFile(fp, (e, data) => {
    if (e) { res.writeHead(404); res.end('nf'); return }
    res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' })
    res.end(data)
  })
})

await new Promise((r) => server.listen(4399, r))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1792, height: 1096 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message))

// Mock API so /api/status returns our fixture (no backend/basic-auth needed).
await page.route('**/api/status', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync('/tmp/status.json', 'utf8') }),
)
await page.route('**/api/version', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: '{"commit":"abc1234","date":null}' }),
)
await page.route('**/api/domains', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync('/tmp/domains.json', 'utf8') }),
)
for (const [ep, file] of [['git', '/tmp/git.json'], ['files', '/tmp/files.json'], ['backups', '/tmp/backups.json'], ['databases', '/tmp/databases.json']]) {
  await page.route(`**/api/${ep}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync(file, 'utf8') }),
  )
}

await page.goto('http://127.0.0.1:4399/', { waitUntil: 'networkidle' })
await page.waitForSelector('nav', { timeout: 5000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: '/home/ubuntu/_render_domains.png' })
console.log('console errors:', errors.length ? errors.join(' | ') : 'none')

// Dark-mode capture: force the .dark class (next-themes applies .dark CSS).
const darkPage = await browser.newPage({ viewport: { width: 1792, height: 1096 } })
const darkErrors = []
darkPage.on('console', (m) => { if (m.type() === 'error') darkErrors.push(m.text()) })
await darkPage.route('**/api/status', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync('/tmp/status.json', 'utf8') }))
await darkPage.route('**/api/version', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: '{"commit":"abc1234","date":null}' }))
await darkPage.addInitScript(() => { try { localStorage.setItem('theme', 'dark') } catch {} })
await darkPage.goto('http://127.0.0.1:4399/', { waitUntil: 'networkidle' })
await darkPage.waitForSelector('nav', { timeout: 5000 })
await darkPage.waitForTimeout(1200)
await darkPage.screenshot({ path: '/home/ubuntu/_render_domains_dark.png' })
console.log('dark console errors:', darkErrors.length ? darkErrors.join(' | ') : 'none')
await darkPage.close()

// Click "Server" to capture that view too (match by text, ignore badge span).
let clicked = false
try {
  await page.click('button:has-text("Server")', { timeout: 2000 })
  clicked = true
} catch { clicked = false }
await page.waitForTimeout(900)
await page.screenshot({ path: '/home/ubuntu/_render_server.png' })
console.log('server view captured:', clicked)

// Capture each wired service panel via the sidebar (real data render check).
const PANELS = ['Databases', 'Git', 'Backup Manager', 'File Manager', 'SSL/TLS', 'Statistics']
for (const label of PANELS) {
  try {
    await page.click(`button:has-text("${label}")`, { timeout: 2000 })
    await page.waitForTimeout(900)
    await page.screenshot({ path: `/home/ubuntu/_render_${label.toLowerCase().replace(/[^a-z]/g, '')}.png` })
    console.log('panel captured:', label)
  } catch (e) {
    console.log('panel MISSING:', label, e.message)
  }
}

await browser.close()
server.close()
