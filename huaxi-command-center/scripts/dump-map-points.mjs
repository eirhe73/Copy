import fs from 'fs'
const js = fs.readFileSync('reference/original-index.js', 'utf8')

function extractBetween(startMarker, endMarker) {
  const start = js.indexOf(startMarker)
  if (start < 0) throw new Error('missing ' + startMarker)
  const from = start + startMarker.length
  const end = js.indexOf(endMarker, from)
  const arrText = js.slice(from, end)
  // eslint-disable-next-line no-eval
  return eval(arrText)
}

const YX = extractBetween('YX=', ',KX=')
const KX = extractBetween('KX=', ',JX=')
const JX = extractBetween('JX=', ',ZX=')
const ZX = extractBetween('ZX=', '];function QX')

fs.writeFileSync('src/data/map-points.json', JSON.stringify({ YX, KX, JX, ZX }, null, 2))
console.log({ yx: YX.length, kx: KX.length, jx: JX.length, zx: ZX.length })
