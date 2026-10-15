import * as THREE from 'three'
import {
  cloneHospitalModel,
  loadHospitalGlbTemplates,
  recenterCampusOnAnchor,
  type HospitalGlbTemplates,
} from '../digital-twin/hospitalGlbAssets'
import { stylizeCampusMeshes, tierLegendColor } from './hospitalCampusStyle'

type MapThree = {
  markerGlow: number
  terrainSide: number
  terrainTop: number
  edgeGlow: number
  markerByTier: [number, number, number]
}

export async function loadCampusTemplates(): Promise<HospitalGlbTemplates | null> {
  try {
    return await loadHospitalGlbTemplates()
  } catch (err) {
    console.warn('[hospitalCampus] GLB 加载失败，回退菱形标记', err)
    return null
  }
}

/** 在已有 Group（已设 xy）上挂载院区 GLB，返回顶面高度（地图局部 Z） */
export function attachCampusGlb(
  g: THREE.Group,
  tier: number,
  templates: HospitalGlbTemplates,
  t: MapThree,
  displayScale = 1,
): number {
  const tierKey = Math.min(3, Math.max(0, tier))
  const template = templates.get(tierKey)
  if (!template) return 0

  const shadowR = (0.22 + tierKey * 0.04) * displayScale
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(shadowR, 40),
    new THREE.MeshBasicMaterial({
      color: t.terrainSide,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  )
  shadow.position.z = 0.003
  g.add(shadow)

  const { model, height } = cloneHospitalModel(template, tierKey)
  if (displayScale !== 1) {
    model.scale.x *= displayScale
    model.scale.y *= displayScale
    model.scale.z *= displayScale
  }
  /** 竖向拉高，占地不变 */
  const heightStretch = 1.58
  model.scale.z *= heightStretch
  recenterCampusOnAnchor(model)
  stylizeCampusMeshes(model, t, tierKey)
  g.add(model)
  const box2 = new THREE.Box3().setFromObject(model)
  return Math.max(box2.max.z - box2.min.z, height * displayScale * heightStretch) + 0.04
}

/** 首页：单圈淡光，不用三层波纹 */
export function addCampusBasePlate(g: THREE.Group, t: MapThree, tier: number) {
  const r = 0.12 + tier * 0.025
  const c = tierLegendColor(tier)
  g.add(
    new THREE.Mesh(
      new THREE.RingGeometry(r * 0.55, r, 48),
      new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    ),
  )
  g.add(
    new THREE.Mesh(
      new THREE.RingGeometry(r * 1.02, r * 1.14, 48),
      new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    ),
  )
}

export function addCampusPulseRings(g: THREE.Group, t: MapThree) {
  addCampusBasePlate(g, t, 0)
}
