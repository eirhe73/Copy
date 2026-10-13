import fs from 'fs'
const js = fs.readFileSync('reference/original-index.js', 'utf8')
const i = js.indexOf('function QX(')
console.log(js.slice(i, i + 2500))
