import fs from 'fs'
const js = fs.readFileSync('reference/original-index.js', 'utf8')
const start = js.indexOf('function Upe(')
console.log('Upe start', start)
if (start >= 0) console.log(js.slice(start, start + 4500))

const navBlocks = [...js.matchAll(/to:"(\/[^"]+)",children:"([^"]+)"/g)]
const uniq = new Map()
for (const [, to, label] of navBlocks) uniq.set(to + label, { to, label })
console.log('\nLinks:', [...uniq.values()].slice(0, 40))
