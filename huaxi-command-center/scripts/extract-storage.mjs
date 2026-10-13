import fs from 'fs'
const js = fs.readFileSync('reference/original-index.js', 'utf8')
const i = js.indexOf('fetch("/scenario.json")')
console.log(js.slice(i - 200, i + 600))
