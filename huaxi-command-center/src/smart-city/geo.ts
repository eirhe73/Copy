import type { Shape } from 'three'

export type GeoJson = {
  type: string
  features: Array<{
    geometry: {
      type: string
      coordinates: number[][][][] | number[][][]
    }
  }>
}

export function getRings(geo: GeoJson): number[][][] {
  const geom = geo.features[0].geometry
  if (geom.type === 'MultiPolygon') {
    return (geom.coordinates as number[][][][]).map((poly) => poly[0])
  }
  return [geom.coordinates[0] as number[][]]
}

export function projectRing(
  ring: number[][],
  center: { lng: number; lat: number },
  scale: number,
  cosLat: number,
) {
  return ring.map(([lng, lat]) => ({
    x: (lng - center.lng) * scale * cosLat,
    y: (lat - center.lat) * scale,
  }))
}

export function ringBounds(ring: number[][]) {
  const lngs = ring.map((p) => p[0])
  const lats = ring.map((p) => p[1])
  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
  }
}

export function projectLngLat(
  lng: number,
  lat: number,
  center: { lng: number; lat: number },
  scale: number,
  cosLat: number,
) {
  return {
    x: (lng - center.lng) * scale * cosLat,
    y: (lat - center.lat) * scale,
  }
}

/** 射线法：节点是否落在县界多边形内（仅外环） */
export function pointInLngLatRing(lng: number, lat: number, ring: number[][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/** 不在县界内时，拉到边界内侧一点，避免院区“漂在地图外” */
export function snapLngLatToRing(lng: number, lat: number, ring: number[][], inset = 0.012) {
  if (pointInLngLatRing(lng, lat, ring)) return { lng, lat }

  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length
  const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length

  let lo = 0
  let hi = 1
  let best = { lng, lat }
  for (let k = 0; k < 24; k++) {
    const t = (lo + hi) / 2
    const tlng = lng + (cx - lng) * t
    const tlat = lat + (cy - lat) * t
    if (pointInLngLatRing(tlng, tlat, ring)) {
      best = { lng: tlng, lat: tlat }
      lo = t
    } else {
      hi = t
    }
  }
  return {
    lng: best.lng + (cx - best.lng) * inset,
    lat: best.lat + (cy - best.lat) * inset,
  }
}

export function buildShapeFromPoints(
  points: { x: number; y: number }[],
  THREE: typeof import('three'),
): InstanceType<typeof Shape> {
  const shape = new THREE.Shape()
  points.forEach((p, i) => {
    if (i === 0) shape.moveTo(p.x, p.y)
    else shape.lineTo(p.x, p.y)
  })
  return shape
}
