import * as THREE from 'three'
import { hexToThree } from '../mapTheme'

/** 与 map-presentation.css 图例完全一致 */
export const TIER_LEGEND_HEX = ['#1e4b7b', '#2563eb', '#38bdf8'] as const

/** 每级只围绕图例主色：墙/标识/发光同一色相，仅深浅区分 */
const TIER_PALETTE = [
  { primary: TIER_LEGEND_HEX[0], shade: '#153a61', tint: '#6b9cc8' },
  { primary: TIER_LEGEND_HEX[1], shade: '#1d4ed8', tint: '#93c5fd' },
  { primary: TIER_LEGEND_HEX[2], shade: '#0ea5e9', tint: '#e0f2fe' },
  { primary: TIER_LEGEND_HEX[0], shade: '#1d4ed8', tint: '#7eb3d8' },
] as const

type GisThree = {
  terrainTop: number
  terrainSide: number
  edgeGlow: number
  markerByTier: [number, number, number]
}

function paletteForTier(tier: number) {
  return TIER_PALETTE[Math.min(3, Math.max(0, tier))] ?? TIER_PALETTE[0]
}

type MatKind = 'window' | 'accent' | 'roof' | 'wall'

function materialKind(m: THREE.Material): MatKind {
  const n = (m.name || '').toLowerCase()
  if (n.includes('glass') || n.includes('win') || n.includes('door')) return 'window'
  if (n.includes('accent') || n.includes('emblem') || n.includes('sign') || n.includes('flag')) return 'accent'
  if (n.includes('roof')) return 'roof'
  if (m instanceof THREE.MeshStandardMaterial) {
    const e = m.emissiveIntensity ?? 0
    if (e > 0.35) return 'window'
  }
  return 'wall'
}

function paintMeshMaterial(
  m: THREE.Material,
  kind: MatKind,
  p: (typeof TIER_PALETTE)[number],
  mapTop: THREE.Color,
) {
  const primary = new THREE.Color(hexToThree(p.primary))
  const shade = new THREE.Color(hexToThree(p.shade))
  const windowWhite = new THREE.Color(0xffffff)

  if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
    if (kind === 'window') {
      m.color.copy(windowWhite)
      m.emissive.copy(windowWhite)
      m.emissiveIntensity = 0.12
    } else if (kind === 'roof') {
      m.color.copy(shade)
      m.emissive.copy(primary)
      m.emissiveIntensity = 0.18
    } else {
      m.color.copy(kind === 'accent' ? primary : primary)
      m.emissive.copy(primary)
      m.emissiveIntensity = kind === 'accent' ? 0.32 : 0.22
    }
    m.metalness = 0.05
    m.roughness = 0.54
    m.userData.baseEmissiveIntensity = m.emissiveIntensity
    return
  }
  if (m instanceof THREE.MeshPhongMaterial || m instanceof THREE.MeshLambertMaterial) {
    if (kind === 'window') m.color.copy(windowWhite)
    else if (kind === 'roof') m.color.copy(shade)
    else m.color.copy(primary)
    if ('emissive' in m && m.emissive instanceof THREE.Color) {
      if (kind === 'window') {
        m.emissive.copy(windowWhite)
        m.emissiveIntensity = 0.15
      } else {
        m.emissive.copy(primary)
        m.emissiveIntensity = 0.2
      }
      m.userData.baseEmissiveIntensity = m.emissiveIntensity
    }
    return
  }
  if (m instanceof THREE.MeshBasicMaterial && m.color) {
    if (kind === 'window') m.color.copy(windowWhite)
    else m.color.copy(kind === 'roof' ? shade : primary)
  }
}

/** 按 tier 上色，与右侧图例菱形色一致 */
export function stylizeCampusMeshes(root: THREE.Object3D, t: GisThree, tier: number) {
  const p = paletteForTier(tier)

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.material) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const m of mats) {
      paintMeshMaterial(m, materialKind(m), p, new THREE.Color(t.terrainTop))
    }
  })
}

export function tierLegendColor(tier: number): number {
  const idx = Math.min(2, Math.max(0, tier))
  return hexToThree(TIER_LEGEND_HEX[idx])
}

export function tierLegendHex(tier: number): string {
  const idx = Math.min(2, Math.max(0, tier))
  return TIER_LEGEND_HEX[idx]
}

