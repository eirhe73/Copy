import * as THREE from 'three'
import { hexToThree } from '../mapTheme'

/** 与 map-presentation.css 图例完全一致（仅图例/文案分级用） */
export const TIER_LEGEND_HEX = ['#1e4b7b', '#2563eb', '#38bdf8'] as const

/** 地图上所有院区 GLB 统一体量色（略浅，贴近浅色 GIS 底） */
export const CAMPUS_UNIFIED_HEX = '#4a7ab0'
export const CAMPUS_UNIFIED_SHADE = '#2563eb'

const TIER_SHADE = ['#153a61', '#1d4ed8', '#0ea5e9'] as const

type GisThree = {
  terrainTop: number
  terrainSide: number
  edgeGlow: number
  markerByTier: [number, number, number]
}

function tierPrimaryHex(tier: number): string {
  const idx = Math.min(2, Math.max(0, tier))
  return TIER_LEGEND_HEX[idx]
}

function tierShadeHex(tier: number): string {
  const idx = Math.min(2, Math.max(0, tier))
  return TIER_SHADE[idx]
}

type MatKind = 'window' | 'roof' | 'body'

const WINDOW_WHITE = new THREE.Color(0xffffff)
const _hsl = { h: 0, s: 0, l: 0 }

/** GLB 导出后材质名常变成 Material.001，用网格名 + 原 emissive 辅助识别窗带 */
function resolveMatKind(mesh: THREE.Mesh, m: THREE.Material): MatKind {
  const mn = (mesh.name || '').toLowerCase()
  const n = (m.name || '').toLowerCase()

  if (
    n.includes('glass') ||
    n.includes('dt_glass') ||
    mn.includes('glass') ||
    mn.includes('door') ||
    mn.includes('_win') ||
    /_w\d/.test(mn) ||
    mn.includes('winband')
  ) {
    return 'window'
  }

  if (n.includes('roof') || mn.includes('roof')) return 'roof'

  if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
    const e = m.emissiveIntensity ?? 0
    const em = m.emissive
    if (e > 0.08 && em) {
      em.getHSL(_hsl)
      if (_hsl.s > 0.35 && _hsl.l > 0.25) return 'window'
    }
  }

  return 'body'
}

function paintMeshMaterial(m: THREE.Material, kind: MatKind, primary: THREE.Color, shade: THREE.Color) {
  if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
    if (kind === 'window') {
      m.color.copy(WINDOW_WHITE)
      m.emissive.copy(WINDOW_WHITE)
      m.emissiveIntensity = 0.1
      m.metalness = 0
      m.roughness = 0.38
    } else if (kind === 'roof') {
      m.color.copy(shade)
      m.emissive.copy(primary)
      m.emissiveIntensity = 0.16
      m.metalness = 0.04
      m.roughness = 0.56
    } else {
      m.color.copy(primary)
      m.emissive.copy(primary)
      m.emissiveIntensity = 0.2
      m.metalness = 0.05
      m.roughness = 0.54
    }
    m.userData.baseEmissiveIntensity = m.emissiveIntensity
    return
  }
  if (m instanceof THREE.MeshPhongMaterial || m instanceof THREE.MeshLambertMaterial) {
    if (kind === 'window') m.color.copy(WINDOW_WHITE)
    else if (kind === 'roof') m.color.copy(shade)
    else m.color.copy(primary)
    if ('emissive' in m && m.emissive instanceof THREE.Color) {
      if (kind === 'window') {
        m.emissive.copy(WINDOW_WHITE)
        m.emissiveIntensity = 0.12
      } else {
        m.emissive.copy(primary)
        m.emissiveIntensity = 0.18
      }
      m.userData.baseEmissiveIntensity = m.emissiveIntensity
    }
    return
  }
  if (m instanceof THREE.MeshBasicMaterial && m.color) {
    m.color.copy(kind === 'window' ? WINDOW_WHITE : kind === 'roof' ? shade : primary)
  }
}

/** 院区上色：全部统一深蓝主色 + 白窗（tier 只影响模板尺寸，不影响色相） */
export function stylizeCampusMeshes(root: THREE.Object3D, _t: GisThree, _tier: number) {
  const primary = new THREE.Color(hexToThree(CAMPUS_UNIFIED_HEX))
  const shade = new THREE.Color(hexToThree(CAMPUS_UNIFIED_SHADE))

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.material) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const m of mats) {
      paintMeshMaterial(m, resolveMatKind(obj, m), primary, shade)
    }
  })
}

/** 脚下光环等与楼体一致 */
export function tierLegendColor(_tier: number): number {
  return hexToThree(CAMPUS_UNIFIED_HEX)
}

export function tierLegendHex(tier: number): string {
  return tierPrimaryHex(tier)
}

export function campusUnifiedHex(): string {
  return CAMPUS_UNIFIED_HEX
}

export function campusUnifiedColor(): number {
  return hexToThree(CAMPUS_UNIFIED_HEX)
}

