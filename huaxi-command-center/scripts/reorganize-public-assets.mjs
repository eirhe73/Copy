/**
 * 一次性：public/assets 分子目录并更新仓库内引用路径
 * 运行: node scripts/reorganize-public-assets.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = path.join(root, 'public', 'assets')

const BACKEND = new Set([
  'app-embed-guard.js',
  'startup-loading-enhance.js',
  'boot-recover.js',
  'login-page.js',
  'app-integrated-nav.js',
  'backend-api-config.js',
  'backend-auth-gate.js',
  'backend-api-bridge.js',
  'backend-api-catalog.js',
  'backend-api-catalog-gaps.js',
  'backend-api-bindings-merge.js',
  'backend-api-samples.js',
  'backend-full-sync.js',
  'backend-scenario-live-merge.js',
  'backend-write-proxy.js',
  'backend-api-write-dock.js',
  'backend-api-session-connect.js',
  'backend-api-global-probe.js',
  'backend-route-full-enhance.js',
])

const VENDOR = new Set(['index-BA_IO3dC.js', 'index-BRuArrdm.css'])

const THEME = new Set(['theme-light.css', 'sidebar-shell-layout.css', 'map-presentation.css'])

const STATIC = new Set([
  'scenario.json',
  'hospitals-3d.json',
  'icons.svg',
  'favicon.svg',
  'theme-optional-readme.txt',
])

const SKIP = new Set(['README.md'])

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true })
}

function moveFile(name, subdir) {
  const from = path.join(assetsDir, name)
  if (!fs.existsSync(from)) return null
  const to = path.join(assetsDir, subdir, name)
  ensureDir(path.dirname(to))
  fs.renameSync(from, to)
  return `/assets/${name}`.replace('/assets/', `/assets/${subdir}/`)
}

function main() {
  ensureDir(path.join(assetsDir, 'vendor'))
  ensureDir(path.join(assetsDir, 'theme'))
  ensureDir(path.join(assetsDir, 'backend'))
  ensureDir(path.join(assetsDir, 'enhance'))
  ensureDir(path.join(assetsDir, 'static'))

  const replacements = new Map()

  for (const name of fs.readdirSync(assetsDir)) {
    const full = path.join(assetsDir, name)
    if (!fs.statSync(full).isFile()) continue
    if (SKIP.has(name)) continue
    if (name.endsWith('.bak-dr-subnav') || name.endsWith('.bak-dr-tab')) {
      fs.unlinkSync(full)
      console.log('deleted', name)
      continue
    }
    let sub = 'enhance'
    if (VENDOR.has(name)) sub = 'vendor'
    else if (THEME.has(name)) sub = 'theme'
    else if (BACKEND.has(name)) sub = 'backend'
    else if (STATIC.has(name)) sub = 'static'
    else if (!name.endsWith('.js') && !name.endsWith('.css')) sub = 'static'

    const oldPath = `/assets/${name}`
    const newPath = `/assets/${sub}/${name}`
    if (oldPath === newPath) continue
    moveFile(name, sub)
    replacements.set(oldPath, newPath)
    console.log(oldPath, '->', newPath)
  }

  const dupRoot = path.join(root, 'care-link-enhance.js')
  if (fs.existsSync(dupRoot)) {
    fs.unlinkSync(dupRoot)
    console.log('deleted root care-link-enhance.js duplicate')
  }

  const exts = new Set(['.html', '.js', '.mjs', '.ts', '.tsx', '.vue', '.css', '.md', '.json'])
  const skipDirs = new Set(['node_modules', 'dist', '.git', 'reference'])

  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(ent.name)) continue
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(p)
      else if (exts.has(path.extname(ent.name))) {
        let text = fs.readFileSync(p, 'utf8')
        let changed = false
        for (const [oldP, newP] of replacements) {
          if (text.includes(oldP)) {
            text = text.split(oldP).join(newP)
            changed = true
          }
        }
        if (changed) {
          fs.writeFileSync(p, text, 'utf8')
          console.log('patched', path.relative(root, p))
        }
      }
    }
  }

  walk(root)

  // package.json restore:original paths
  const pkgPath = path.join(root, 'package.json')
  let pkg = fs.readFileSync(pkgPath, 'utf8')
  pkg = pkg.replace(
    /public\/assets\/index-BA_IO3dC\.js/g,
    'public/assets/vendor/index-BA_IO3dC.js',
  )
  pkg = pkg.replace(
    /public\/assets\/index-BRuArrdm\.css/g,
    'public/assets/vendor/index-BRuArrdm.css',
  )
  fs.writeFileSync(pkgPath, pkg, 'utf8')
  console.log('patched package.json restore paths')
  console.log('Done. Run: npm run sync:app-html')
}

main()
