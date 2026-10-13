import fs from 'fs'
const js = fs.readFileSync('reference/original-index.js', 'utf8')
for (const key of ['patients:[', 'vehicles:[', 'const Wr=', 'function qn(', 'scenario']) {
  const i = js.indexOf(key)
  console.log(key, i)
  if (i >= 0) console.log(js.slice(i, i + 400), '\n---')
}
