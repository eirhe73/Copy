import fs from 'fs'

const js = fs.readFileSync('public/assets/vendor/index-BA_IO3dC.js', 'utf8')
const hpStart = js.indexOf('const HP=[')
const hpEnd = js.indexOf('];function n$', hpStart)
const HP = eval(js.slice(hpStart + 'const HP='.length, hpEnd + 1))

function n$(linkPath, pathname, searchParams) {
  const r = new URL(linkPath, 'http://local')
  const i = searchParams
  return (
    r.pathname === pathname &&
    ['mode', 'view', 'focus', 'scope', 'tier', 'type', 'hub'].every(
      (a) => r.searchParams.get(a) === i.get(a),
    )
  )
}

function r$(pathname, searchParams) {
  if (pathname.startsWith('/episode/')) return 0
  if (pathname.startsWith('/bed/')) return 2
  if (
    pathname.startsWith('/patient/') ||
    pathname.startsWith('/transport/') ||
    pathname.startsWith('/mobile-reception/')
  )
    return 0
  if (pathname.startsWith('/medical-quality/')) return 3
  return HP.findIndex((n) => n.links.some(([r]) => n$(r, pathname, searchParams)))
}

const icons = js.match(/const S=\[(Hl,Vh,Ru,Hs,C6)\]/)?.[1]
const fiveModules = js.includes('五个业务模块')
const noGrassrootsTop = !HP.some((h) => h.title === '基层调度')
const ambulance = HP[0].links.some(([p, l]) => l === '救护车列表')

const cases = [
  ['/#/ambulances', '/ambulances', ''],
  ['/#/dispatch/list', '/dispatch/list', ''],
  ['/#/consultations?tab=grassroots', '/consultations', 'tab=grassroots'],
  ['/#/consultations', '/consultations', ''],
  ['/#/critical?mode=grassroots-remote', '/critical', 'mode=grassroots-remote', '智慧急救调度'],
  ['/#/medical-quality', '/medical-quality', '', '智能医疗质控'],
]

let failed = 0
if (!fiveModules) {
  console.error('FAIL: main nav should say 五个业务模块')
  failed++
}
if (!noGrassrootsTop) {
  console.error('FAIL: 基层调度 should not be top-level')
  failed++
}
if (!icons) {
  console.error('FAIL: main nav icon array not 5 entries')
  failed++
}
if (!ambulance) {
  console.error('FAIL: 救护车列表 missing from dispatch links')
  failed++
}

for (const row of cases) {
  const [label, pathname, qs, expectTitle] = row
  const q = new URLSearchParams(qs)
  const idx = r$(pathname, q)
  const title = idx >= 0 ? HP[idx].title : 'NONE'
  const link = idx >= 0 ? HP[idx].links.find(([r]) => n$(r, pathname, q)) : null
  if (idx < 0 || !link || (expectTitle && title !== expectTitle)) {
    console.error('FAIL', label, title, expectTitle || '')
    failed++
  } else {
    console.log('OK', label, '→', title, '·', link[1])
  }
}

const dispatchGrass = HP[0].links.map((l) => l[1])
for (const name of ['医院转诊', '基层远程监护']) {
  if (!dispatchGrass.includes(name)) {
    console.error('FAIL: missing under 智慧急救调度:', name)
    failed++
  }
}

process.exit(failed ? 1 : 0)
