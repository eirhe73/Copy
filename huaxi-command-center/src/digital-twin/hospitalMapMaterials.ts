import * as THREE from 'three'

export function applyHospitalSelectionVisual(
  obj: THREE.Object3D,
  selected: boolean,
  dimmed: boolean,
) {
  if (!(obj instanceof THREE.Mesh) || !obj.material) return
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
  for (const m of mats) {
    if (m instanceof THREE.MeshPhongMaterial || m instanceof THREE.MeshStandardMaterial) {
      const baseI =
        typeof obj.userData.baseEmissiveIntensity === 'number'
          ? obj.userData.baseEmissiveIntensity
          : m instanceof THREE.MeshStandardMaterial
            ? 0.35
            : 0.1
      m.emissiveIntensity = selected ? baseI + 0.45 : dimmed ? baseI * 0.3 : baseI
      m.opacity = dimmed ? 0.42 : 1
      m.transparent = dimmed
    }
  }
}
