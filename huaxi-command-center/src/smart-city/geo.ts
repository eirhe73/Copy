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
