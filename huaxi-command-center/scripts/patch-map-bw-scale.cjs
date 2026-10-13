/**
 * B&W map theme + smaller diamonds / flow lines
 */
const fs = require('fs')
const path = require('path')
const files = ['public/assets/index-BA_IO3dC.js', 'dist/assets/index-BA_IO3dC.js'].map((p) =>
  path.join(__dirname, '..', p),
)

const replacements = [
  // terrain
  [
    'new Ab({color:10995664,emissive:5263440,shininess:14,...ze}),new Ab({color:1469236,emissive:339478,...ze})',
    'new Ab({color:14935011,emissive:8684676,shininess:12,...ze}),new Ab({color:4210752,emissive:1513239,...ze})',
  ],
  ['new pp({color:1879168})', 'new pp({color:11776947})'],
  [
    'new ns({color:1879168,wireframe:!0,transparent:!0,opacity:.1})',
    'new ns({color:13421772,wireframe:!0,transparent:!0,opacity:.08})',
  ],
  ['const Ae=new qW(14549217,0.92)', 'const Ae=new qW(14540253,0.88)'],
  ['ie=[1469236,366953,3440841]', 'ie=[2500134,5395026,9211020]'],
  ['Ke.fillStyle=ze?"#14532d":"#047857"', 'Ke.fillStyle=ze?"#171717":"#737373"'],
  // county outline tubes (thinner)
  [
    'new Sp(Xe,Ke.length,.045,5,!0),new ns({color:2263842}',
    'new Sp(Xe,Ke.length,.028,4,!0),new ns({color:9211020}',
  ],
  [
    'new Sp(Xe,Ke.length,.065,5,!0),new ns({color:2263842,transparent:!0,opacity:.08',
    'new Sp(Xe,Ke.length,.038,4,!0),new ns({color:9211020,transparent:!0,opacity:.06',
  ],
  // diamonds + beams (smaller)
  [
    'new _r(new T2(.3),new Ab({color:ie[W.type],emissive:ie[W.type],emissiveIntensity:.18}));Te.position.z=.4,Te.rotation.x=Math.PI/2,Te.scale.y=1.35',
    'new _r(new T2(.2),new Ab({color:ie[W.type],emissive:ie[W.type],emissiveIntensity:.15}));Te.position.z=.32,Te.rotation.x=Math.PI/2,Te.scale.y=1.05',
  ],
  [
    'new _r(new x2(.02,.06,1.4,8,1,!0),new ns({color:ie[W.type],transparent:!0,opacity:.28',
    'new _r(new x2(.012,.034,.85,8,1,!0),new ns({color:ie[W.type],transparent:!0,opacity:.22',
  ],
  ['ze.position.z=1.1,ae.add(ze)', 'ze.position.z=.72,ae.add(ze)'],
  [
    'for(const Me of[.21,.33]){const Ke=new _r(new dy(Me,Me+.022,48)',
    'for(const Me of[.13,.2]){const Ke=new _r(new dy(Me,Me+.014,48)',
  ],
  // collab arcs + flow particles (thinner / smaller)
  ['Xe.z=1.6;const ft=new S2', 'Xe.z=1.28;const ft=new S2'],
  [
    'new Sp(ft,40,.042,5),new ns({color:2263842,transparent:!0,opacity:.55',
    'new Sp(ft,36,.022,4),new ns({color:9211020,transparent:!0,opacity:.42',
  ],
  [
    'const me=new _r(new P2(.06,10,10),new ns({color:2263842,transparent:!0,opacity:.92',
    'const me=new _r(new P2(.032,8,8),new ns({color:9211020,transparent:!0,opacity:.88',
  ],
  // remaining green line color → gray
  ['2263842', '9211020'],
]

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8')
  for (const [from, to] of replacements) {
    if (from === '2263842') {
      s = s.split(from).join(to)
      continue
    }
    if (!s.includes(from)) {
      console.warn('MISSING', path.basename(file), from.slice(0, 70))
      continue
    }
    s = s.replace(from, to)
  }
  fs.writeFileSync(file, s)
  console.log('ok', file)
}
