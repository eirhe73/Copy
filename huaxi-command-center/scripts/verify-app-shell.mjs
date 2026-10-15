/**
 * 校验 app-shell manifest 引用的文件均存在于 public/
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  styles,
  backendScripts,
  reactEntry,
  mapScripts,
  enhanceScripts,
} from '../config/app-shell.manifest.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')

function hrefToFile(href) {
  const u = href.split('?')[0]
  return path.join(publicDir, u.replace(/^\//, ''))
}

function srcToFile(src) {
  return hrefToFile(src)
}

const all = [
  ...styles.map((s) => hrefToFile(s.href)),
  ...backendScripts.map((s) => srcToFile(s.src)),
  srcToFile(reactEntry.src),
  ...mapScripts.map((s) => srcToFile(s.src)),
  ...enhanceScripts.map((s) => srcToFile(s.src)),
]

let fail = 0
for (const f of all) {
  if (!fs.existsSync(f)) {
    console.error('MISSING', path.relative(root, f))
    fail++
  }
}
if (fail) {
  console.error(`${fail} missing asset(s)`)
  process.exit(1)
}
console.log(`OK: ${all.length} app-shell assets present`)
