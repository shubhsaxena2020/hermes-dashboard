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

await page.goto('http://127.0.0.1:4399/', { waitUntil: 'networkidle' })
await page.waitForSelector('nav', { timeout: 5000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: '/home/ubuntu/_render_domains.png' })
console.log('console errors:', errors.length ? errors.join(' | ') : 'none')

// Click "Server" to capture that view too (match by text, ignore badge span).
let clicked = false
try {
  await page.click('button:has-text("Server")', { timeout: 2000 })
  clicked = true
} catch { clicked = false }
await page.waitForTimeout(900)
await page.screenshot({ path: '/home/ubuntu/_render_server.png' })
console.log('server view captured:', clicked)

await browser.close()
server.close()
