import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const HOSPITAL_GLB_BY_TIER = {
  0: '/models/hospitals/hospital-tier0-county.glb',
  1: '/models/hospitals/hospital-tier1-township.glb',
  2: '/models/hospitals/hospital-tier2-village.glb',
  3: '/models/hospitals/hospital-partner-flagship.glb',
} as const

/** 地图单位：院区占地宽度（约县界宽度的 35~55%） */
const TARGET_FOOTPRINT = [0.6, 0.48, 0.37, 0.55] as const

const LAYOUT_VERSION = 5

export function recenterCampusOnAnchor(model: THREE.Object3D) {
  model.updateMatrixWorld(true)
  const box = computeCampusCoreBox(model)
  const c = box.getCenter(new THREE.Vector3())
  model.position.x -= c.x
  model.position.y -= c.y
  model.position.z -= box.min.z
}

const _v = new THREE.Vector3()

/** 合并 GLB 含远距树木时，用核心顶点框定楼群，避免锚点被拉偏 */
function computeCampusCoreBox(root: THREE.Object3D): THREE.Box3 {
  const verts: THREE.Vector3[] = []
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.geometry) return
    const pos = obj.geometry.getAttribute('position')
    if (!pos) return
    obj.updateWorldMatrix(true, false)
    const mw = obj.matrixWorld
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(mw)
      verts.push(_v.clone())
    }
  })
  if (!verts.length) return new THREE.Box3().setFromObject(root)

  const cx = verts.reduce((s, p) => s + p.x, 0) / verts.length
  const cy = verts.reduce((s, p) => s + p.y, 0) / verts.length
  const cz = verts.reduce((s, p) => s + p.z, 0) / verts.length
  const centroid = new THREE.Vector3(cx, cy, cz)
  const dists = verts.map((p) => p.distanceTo(centroid)).sort((a, b) => a - b)
  const radius = dists[Math.floor(dists.length * 0.38)] ?? dists.at(-1) ?? 1

  const box = new THREE.Box3()
  for (const p of verts) {
    if (p.distanceTo(centroid) <= radius * 1.08) box.expandByPoint(p)
  }
  if (box.isEmpty()) box.setFromObject(root)
  return box
}

const TIER_LABEL = ['县级', '乡镇', '村室', '协作'] as const

export type HospitalGlbTemplates = Map<number, THREE.Group>

let loadPromise: Promise<HospitalGlbTemplates> | null = null
let loadedLayoutVersion = 0

function tuneMaterial(m: THREE.Material) {
  if (m instanceof THREE.MeshStandardMaterial) {
    m.metalness = Math.min(m.metalness, 0.2)
    m.roughness = Math.max(m.roughness, 0.55)
    if (m.emissive) {
      const base = Math.min(Math.max(m.emissiveIntensity ?? 0, 0.08), 0.28)
      m.emissiveIntensity = base
      m.userData.baseEmissiveIntensity = base
    }
    return
  }
  if (m instanceof THREE.MeshPhongMaterial) {
    const base = m.emissiveIntensity ?? 0.12
    m.userData.baseEmissiveIntensity = base
  }
}

function normalizeToMapUnits(root: THREE.Object3D, tier: number) {
  root.rotation.set(Math.PI / 2, 0, 0)
  root.updateMatrixWorld(true)

  // 先按核心 footprint 缩放（缩放围绕本地原点，必须先做，否则会把居中偏移拉走）
  const box0 = computeCampusCoreBox(root)
  const size0 = box0.getSize(new THREE.Vector3())
  const footprint = Math.max(size0.x, size0.y, 0.001)
  const target = TARGET_FOOTPRINT[Math.min(3, Math.max(0, tier))] ?? TARGET_FOOTPRINT[0]
  root.scale.setScalar(target / footprint)
  root.updateMatrixWorld(true)

  // 再用缩放后的核心盒居中 + 落地
  const box = computeCampusCoreBox(root)
  const center = box.getCenter(new THREE.Vector3())
  root.position.x -= center.x
  root.position.y -= center.y
  root.position.z -= box.min.z
  root.updateMatrixWorld(true)

  const box2 = new THREE.Box3().setFromObject(root)
  return Math.max(box2.max.z - box2.min.z, 0.2)
}

export function loadHospitalGlbTemplates(): Promise<HospitalGlbTemplates> {
  if (loadPromise && loadedLayoutVersion === LAYOUT_VERSION) {
    return loadPromise
  }
  loadedLayoutVersion = LAYOUT_VERSION
  loadPromise = null
  {
    const loader = new GLTFLoader()
    loadPromise = Promise.all(
      ([0, 1, 2, 3] as const).map(async (tier) => {
        const gltf = await loader.loadAsync(HOSPITAL_GLB_BY_TIER[tier])
        const template = gltf.scene
        template.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return
          obj.castShadow = false
          obj.receiveShadow = false
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const m of mats) tuneMaterial(m)
        })
        template.name = `template-tier-${tier}`
        normalizeToMapUnits(template, tier)
        const wrapper = new THREE.Group()
        wrapper.add(template)
        return [tier, wrapper] as const
      }),
    )
      .then((entries) => new Map(entries))
      .catch((err) => {
        loadPromise = null
        throw err
      })
  }
  return loadPromise
}

export function cloneHospitalModel(template: THREE.Group, _tier: number): { model: THREE.Group; height: number } {
  const model = template.clone(true)
  model.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.material) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    const cloned = mats.map((m) => {
      const c = m.clone()
      tuneMaterial(c)
      return c
    })
    obj.material = cloned.length === 1 ? cloned[0] : cloned
  })
  const box = new THREE.Box3().setFromObject(model)
  const height = box.max.z - box.min.z
  return { model, height: height || 0.25 }
}

export function tierBadgeLabel(tier: number) {
  return TIER_LABEL[Math.min(3, Math.max(0, tier))] ?? TIER_LABEL[0]
}
