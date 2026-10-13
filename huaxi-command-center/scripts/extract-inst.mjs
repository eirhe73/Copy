import fs from 'fs'
const js = fs.readFileSync('reference/original-index.js', 'utf8')
const i = js.indexOf('const BH=')
console.log(js.slice(i, i + 4000))
