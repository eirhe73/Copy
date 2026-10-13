/**
 * One-off patcher: green map theme + diamond spin + collab flow links
 */
const fs = require('fs')
const paths = [
  'public/assets/index-BA_IO3dC.js',
  'dist/assets/index-BA_IO3dC.js',
].map((p) => require('path').join(__dirname, '..', p))

const replacements = [
  [
    'new Ab({color:14935011,emissive:8684676,shininess:12,...ze}),new Ab({color:4210752,emissive:1513239,...ze})',
    'new Ab({color:10995664,emissive:5263440,shininess:14,...ze}),new Ab({color:1469236,emissive:339478,...ze})',
  ],
  ['new pp({color:11776947})', 'new pp({color:1879168})'],
  [
    'new ns({color:13421772,wireframe:!0,transparent:!0,opacity:.08})',
    'new ns({color:1879168,wireframe:!0,transparent:!0,opacity:.1})',
  ],
  ['const Ae=new qW(14540253,0.88)', 'const Ae=new qW(14549217,0.92)'],
  ['ie=[2500134,5395026,9211020]', 'ie=[1469236,366953,3440841]'],
  ['9211020', '2263842'],
  ['Ke.fillStyle=ze?"#171717":"#737373"', 'Ke.fillStyle=ze?"#14532d":"#047857"'],
  [
    'const se={weiyuan:[[2,1],[1,0]],dafang:[[8,0],[8,5],[8,7],[8,9],[8,12]]}',
    'const se={weiyuan:[[0,1],[1,2],[2,0],[0,2]],dafang:[[8,0],[8,3],[8,4],[8,5],[8,6],[8,7],[8,9],[8,10],[8,12],[8,13],[8,14],[0,5],[3,4],[5,7],[6,7],[1,2],[10,11],[9,12],[12,13],[7,8],[0,3]]}',
  ],
  [
    'Te.rotation.x=Math.PI/2,Te.scale.z=1.35',
    'Te.rotation.x=Math.PI/2,Te.scale.y=1.35',
  ],
  [
    'Me.rotation.set(Math.PI/2,0,W/1400+Ke)',
    'Me.rotation.set(Math.PI/2,-W/1100-Ke*.35,0)',
  ],
  [
    'const me=new _r(new P2(.05,10,10),new ns({color:2263842,transparent:!0,opacity:.85,blending:1,depthWrite:!1}));E.add(me),k.push({mesh:me,curve:ft,phase:k.length*.35})',
    'const hxMkP=hp=>{const me=new _r(new P2(.06,10,10),new ns({color:2263842,transparent:!0,opacity:.92,blending:1,depthWrite:!1}));E.add(me),k.push({mesh:me,curve:ft,phase:hp})};hxMkP(k.length*.18),hxMkP(k.length*.18+.5)',
  ],
  [
    'k.forEach(({mesh:Me,curve:Ke,phase:Xe})=>{const ft=((W/2600+Xe)%1+1)%1;Me.position.copy(Ke.getPoint(ft)),Me.material.opacity=.3+.6*Math.sin(ft*Math.PI)})',
    'k.forEach(({mesh:Me,curve:Ke,phase:Xe})=>{const ft=((W/1500+Xe)%1+1)%1;Me.position.copy(Ke.getPoint(ft)),Me.material.opacity=.5+.45*Math.sin(ft*Math.PI)})',
  ],
  [
    'new ns({color:2263842,transparent:!0,opacity:1,blending:1,depthWrite:!1,...oe})));const hxMkP',
    'new ns({color:2263842,transparent:!0,opacity:.55,blending:1,depthWrite:!1,...oe})));const hxMkP',
  ],
]

for (const file of paths) {
  let s = fs.readFileSync(file, 'utf8')
  for (const [from, to] of replacements) {
    if (from === '9211020') {
      s = s.split(from).join(to)
      continue
    }
    if (!s.includes(from)) {
      console.warn('MISSING in', file, from.slice(0, 60))
      continue
    }
    s = s.replace(from, to)
  }
  fs.writeFileSync(file, s)
  console.log('patched', file)
}
