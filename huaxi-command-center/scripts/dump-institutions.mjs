import fs from 'fs'
const js = fs.readFileSync('reference/original-index.js', 'utf8')
const start = js.indexOf('const BH=')
const end = js.indexOf('],$H={institutions:BH}')
if (start < 0 || end < 0) throw new Error('not found')
const arrText = js.slice(start + 'const BH='.length, end + 1)
// eslint-disable-next-line no-eval
const institutions = eval(arrText)
fs.writeFileSync('src/data/institutions.json', JSON.stringify(institutions, null, 2))
console.log('institutions', institutions.length)
