/**
 * 首页三维地图：浅色医疗底、实线深蓝连线、三种节点色。
 */
import fs from 'fs'
import path from 'path'

const jsPath = path.join('public', 'assets', 'index-BA_IO3dC.js')
let js = fs.readFileSync(jsPath, 'utf8')

const replacements = [
  // 地形：去掉青光，改浅灰医疗底
  [
    'new Ab({color:15790320,emissive:8900335,shininess:38,...ze}),new Ab({color:12434877,emissive:6591981,...ze})',
    'new Ab({color:14869232,emissive:12104880,shininess:12,...ze}),new Ab({color:14016232,emissive:11056708,...ze})',
  ],
  // 县界：青边改深蓝、加粗
  [
    'new Sp(Xe,Ke.length,.027,5,!0),new ns({color:3447003})',
    'new Sp(Xe,Ke.length,.045,5,!0),new ns({color:1983355})',
  ],
  // 县界外发光：去掉青晕
  [
    'new ns({color:556287,transparent:!0,opacity:.12,depthWrite:!1})',
    'new ns({color:1983355,transparent:!0,opacity:.08,depthWrite:!1})',
  ],
  // 飞线：加粗 + 普通混合（浅色底上 Additive 会洗白）
  [
    'new Sp(ft,40,.028,5),new ns({color:1983355,transparent:!0,opacity:.95,blending:Ll,depthWrite:!1,...oe})',
    'new Sp(ft,40,.042,5),new ns({color:1983355,transparent:!0,opacity:1,blending:1,depthWrite:!1,...oe})',
  ],
  // 飞线粒子：去青点
  [
    'new ns({color:12449535,transparent:!0,opacity:.9,blending:Ll,depthWrite:!1})',
    'new ns({color:1983355,transparent:!0,opacity:.85,blending:1,depthWrite:!1})',
  ],
  // 扇形装饰：关掉青光
  [
    'new ns({color:3135231,transparent:!0,opacity:.08,blending:Ll,depthWrite:!1,side:ka,...oe})',
    'new ns({color:1983355,transparent:!0,opacity:0,blending:1,depthWrite:!1,side:ka,...oe})',
  ],
  [
    'new pp({color:3135231,transparent:!0,opacity:.5,blending:Ll,depthWrite:!1,...oe})',
    'new pp({color:1983355,transparent:!0,opacity:0,blending:1,depthWrite:!1,...oe})',
  ],
  // 节点略放大、少发光
  [
    'new T2(.24),new Ab({color:ie[W.type],emissive:ie[W.type],emissiveIntensity:.45})',
    'new T2(.3),new Ab({color:ie[W.type],emissive:ie[W.type],emissiveIntensity:.18})',
  ],
]

let changed = 0
for (const [from, to] of replacements) {
  if (!js.includes(from)) {
    console.warn('skip (not found):', from.slice(0, 90))
    continue
  }
  js = js.replace(from, to)
  changed++
}

fs.writeFileSync(jsPath, js)
console.log('map refine:', changed, 'replacements')
