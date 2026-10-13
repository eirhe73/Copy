import fs from 'fs'
const js = fs.readFileSync('reference/original-index.js', 'utf8')
const i = js.indexOf('home:"/dispatch"')
console.log(js.slice(i - 150, i + 1200))
