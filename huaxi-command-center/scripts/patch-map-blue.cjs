const fs = require('fs')
const path = require('path')
const files = ['public/assets/index-BA_IO3dC.js', 'dist/assets/index-BA_IO3dC.js'].map((p) =>
  path.join(__dirname, '..', p),
)

const replacements = [
  [
    'new Ab({color:14935011,emissive:8684676,shininess:12,...ze}),new Ab({color:4210752,emissive:1513239,...ze})',
    'new Ab({color:7242725,emissive:1720320,shininess:14,...ze}),new Ab({color:1985403,emissive:994375,...ze})',
  ],
  ['new pp({color:11776947})', 'new pp({color:6809849})'],
  [
    'new ns({color:13421772,wireframe:!0,transparent:!0,opacity:.08})',
    'new ns({color:3718648,wireframe:!0,transparent:!0,opacity:.1})',
  ],
  ['const Ae=new qW(14540253,0.88)', 'const Ae=new qW(8900335,0.95)'],
  ['ie=[2500134,5395026,9211020]', 'ie=[1985403,2453995,3718648]'],
  ['Ke.fillStyle=ze?"#171717":"#737373"', 'Ke.fillStyle=ze?"#1e4b7b":"#475569"'],
  ['9211020', '3718648'],
]

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8')
  for (const [from, to] of replacements) {
    if (from === '9211020') {
      s = s.split(from).join(to)
      continue
    }
    if (!s.includes(from)) console.warn('MISSING', from.slice(0, 60))
    else s = s.replace(from, to)
  }
  fs.writeFileSync(file, s)
  console.log('ok', path.basename(file))
}
