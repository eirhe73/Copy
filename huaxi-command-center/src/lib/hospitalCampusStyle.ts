import * as THREE from 'three'

type GisThree = {
  terrainTop: number
  terrainSide: number
  edgeGlow: number
  markerByTier: [number, number, number]
}

/** 让 GLB 材质贴近首页浅蓝 GIS，减少「脏/糊」的发光 */
export function stylizeCampusMeshes(root: THREE.Object3D, t: GisThree, tier: number) {
  const accent = new THREE.Color(t.markerByTier[Math.min(2, Math.max(0, tier))] ?? t.markerByTier[0])
  const body = new THREE.Color(t.terrainTop)
  const side = new THREE.Color(t.terrainSide)
  const glow = new THREE.Color(t.edgeGlow)

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.material) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const m of mats) {
      if (m instanceof THREE.MeshStandardMaterial) {
        const e = m.emissiveIntensity ?? 0
        const isWindow = e > 0.5 || m.name.toLowerCase().includes('glass')
        if (isWindow) {
          m.color.copy(glow).lerp(body, 0.35)
          m.emissive.copy(accent)
          m.emissiveIntensity = 0.22
        } else {
          m.color.copy(body).lerp(side, 0.25)
          m.emissive.copy(side)
          m.emissiveIntensity = 0.06
        }
        m.metalness = 0.12
        m.roughness = 0.62
        m.userData.baseEmissiveIntensity = m.emissiveIntensity
      }
    }
  })
}
