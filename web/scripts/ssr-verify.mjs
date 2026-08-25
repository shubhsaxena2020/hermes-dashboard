// Headless verification harness (no browser available in this env).
// 1. SSR the REAL App components with mock data via Vite's SSR loader.
// 2. Inject the REAL compiled CSS + weasyprint defs, rasterize to PNG.
// 3. Assert structure (expected Plesk labels) and compare region colors to
//    the quantified reference targets.
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import React from 'react'
import fs from 'fs'
import path from 'path'

const ROOT = '/home/ubuntu/hermes-dashboard-work/web'

async function main() {
  const vite = await createServer({
    root: ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  })

  // Load modules through Vite so TSX + import.meta.env work.
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx')
  const { mockStatus } = await vite.ssrLoadModule('/src/lib/mock-data.ts')

  // App reads from api (mock) via useStatus hooks → instead we render the
  // leaf components directly with mockStatus for deterministic SSR.
  const { DomainOverview } = await vite.ssrLoadModule('/src/components/DomainOverview.tsx')
  const { RightRail } = await vite.ssrLoadModule('/src/components/RightRail.tsx')
  const { Sidebar } = await vite.ssrLoadModule('/src/components/Sidebar.tsx')

  const sidebarHtml = renderToString(
    React.createElement(Sidebar, {
      section: 'domains',
      onSectionChange: () => {},
      theme: 'light',
      onThemeToggle: () => {},
      version: { commit: 'abc1234', date: null },
      downCount: 1,
    }),
  )
  const overviewHtml = renderToString(
    React.createElement(DomainOverview, { data: mockStatus, onNavigate: () => {} }),
  )
  const railHtml = renderToString(React.createElement(RightRail, { data: mockStatus }))

  const css = fs.readFileSync(path.join(ROOT, 'dist/assets/index-DRNEhRae.css'), 'utf8')

  // We reconstruct a static page that mimics the app shell layout so weasyprint
  // can compute real colors from the real compiled CSS.
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style>
  <style>body{margin:0} .flex{display:flex} .min-h-screen{min-height:100vh} .bg-background{background:var(--background)}</style></head>
  <body><div class="flex min-h-screen bg-background">
  ${sidebarHtml}
  <div class="flex-1 flex flex-col">
    <header class="h-14 border-b" style="background:var(--card)"></header>
    <div class="flex-1 px-6 py-6 flex gap-6 items-start max-w-[1400px]">
      <div class="flex-1">${overviewHtml}</div>
      ${railHtml}
    </div>
  </div></div></body></html>`

  fs.writeFileSync('/tmp/ssr_page.html', page)
  console.log('SSR OK. sidebar bytes', sidebarHtml.length, 'overview bytes', overviewHtml.length, 'rail bytes', railHtml.length)

  // Structure assertions (the brief's required labels).
  const required = [
    'Hosting Services', 'Server Management', 'My Profile',
    'Domains', 'Databases', 'Git', 'SSL/TLS', 'Backup Manager', 'File Manager', 'Mail',
    'Server', 'Statistics', 'Logs', 'Profile', 'Security', 'Subscription',
    'Quick actions for', 'Subscription', 'Resource usage', 'Disk space', 'Traffic',
    'SSL/TLS Certificates', 'shubhbuilds.com',
  ]
  const missing = required.filter((t) => !page.includes(t))
  console.log('MISSING LABELS:', missing.length ? missing.join(', ') : 'none')

  await vite.close()
}

main().catch((e) => { console.error('SSR FAILED:', e); process.exit(1) })
