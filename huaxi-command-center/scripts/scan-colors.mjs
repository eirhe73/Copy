import fs from 'fs'
const css = fs.readFileSync('public/assets/vendor/index-BRuArrdm.css', 'utf8')
const colors = [...css.matchAll(/#([0-9a-fA-F]{3,8})\b/g)].map((m) => '#' + m[1].toLowerCase())
const freq = {}
for (const c of colors) freq[c] = (freq[c] || 0) + 1
console.log(
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 35)
    .map(([c, n]) => `${n}\t${c}`)
    .join('\n'),
)
