import fs from 'fs'
const css = fs.readFileSync('public/assets/index-BRuArrdm.css', 'utf8')
const vars = [...css.matchAll(/--([a-z0-9-]+):\s*([^;}{]+)/gi)]
const uniq = new Map()
for (const m of vars) uniq.set(m[1], m[2].trim())
console.log([...uniq.entries()].map(([k, v]) => `--${k}: ${v}`).join('\n'))
