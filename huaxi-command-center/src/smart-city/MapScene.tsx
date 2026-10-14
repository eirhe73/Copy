import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { MapThemeId } from '../mapTheme'
import { getMapTheme } from '../mapTheme'
import { fetchCountyMapCollab } from '../lib/countyMapCollab'
import type { GeoJson } from './geo'
import { buildShapeFromPoints, getRings, projectLngLat, projectRing, ringBounds } from './geo'

type CollabNode = {
  id: string
  name: string
  tier: 0 | 1 | 2
  lng: number
  lat: number
}

type CollabLink = { from: string; to: string }

/** 3D 标记与连线尺寸（相对地图单位，整体偏小） */
const MARKER = {
  tierHeight: [0.92, 0.68, 0.54] as const,
  diamondRadius: 0.058,
  ringInner: 0.038,
  ringWidth: 0.014,
  ringGap: 0.024,
  beamTopR: 0.007,
  beamBottomR: 0.018,
  flowArcLift: 0.48,
  flowOpacity: 0.28,
  pulseRadius: 0.024,
  curveSegments: 36,
} as const

function tierMarkerHeight(tier: number) {
  return MARKER.tierHeight[Math.min(2, Math.max(0, tier))] ?? 0.7
}

/** 进入页面时默认构图：略放大县界，镜头稍近，减少留白 */
const INITIAL_VIEW = {
  geoScale: 13.6,
  fov: 34,
  camX: 0.26,
  camY: 0.44,
  camZ: 0.98,
  minDistRatio: 0.62,
  maxDistRatio: 2.1,
  mapScale: 1.06,
} as const

export type MapSceneProps = {
  themeId: MapThemeId
  region?: 'weiyuan' | 'dafang'
  /** 指挥首页：机构名 + 十字锚点标签（与线上一致） */
  variant?: 'default' | 'command'
}

export function MapScene({ themeId, region = 'weiyuan', variant = 'default' }: MapSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const theme = getMapTheme(themeId)
    const t = theme.three

    let disposed = false
    let frame = 0
    const cleanups: (() => void)[] = []

    async function init(mount: HTMLDivElement) {
      const geoRes = await fetch(`/maps/${region}.json`)
      if (!geoRes.ok) throw new Error('地图数据加载失败')
      const geo = (await geoRes.json()) as GeoJson
      if (disposed) return

      let nodes: CollabNode[]
      let links: CollabLink[]
      if (variant === 'command') {
        const live = await fetchCountyMapCollab(region)
        if (disposed) return
        nodes = live.nodes
        links = live.links
      } else {
        const collabRes = await fetch('/api/gis-collab.json', { cache: 'no-store' })
        if (!collabRes.ok) throw new Error('协同数据加载失败')
        const collab = (await collabRes.json()) as Record<
          string,
          { nodes: CollabNode[]; links: CollabLink[] }
        >
        const pack = collab[region] ?? collab.weiyuan
        nodes = pack.nodes
        links = pack.links
      }

      const ring = getRings(geo)[0]
      const bounds = ringBounds(ring)
      const scale = INITIAL_VIEW.geoScale / (bounds.maxLat - bounds.minLat)
      const cosLat = Math.cos(bounds.centerLat * (Math.PI / 180))
      const center = { lng: bounds.centerLng, lat: bounds.centerLat }
      const flat = projectRing(ring, center, scale, cosLat)
      const widthSpan = (bounds.maxLng - bounds.minLng) * scale * cosLat

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      mount.appendChild(renderer.domElement)

      const labelRenderer = new CSS2DRenderer()
      labelRenderer.setSize(mount.clientWidth, mount.clientHeight)
      labelRenderer.domElement.className = 'sc-map-label-layer'
      mount.appendChild(labelRenderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        INITIAL_VIEW.fov,
        mount.clientWidth / mount.clientHeight,
        0.1,
        200,
      )
      camera.position.set(
        -widthSpan * INITIAL_VIEW.camX,
        -widthSpan * INITIAL_VIEW.camY,
        widthSpan * INITIAL_VIEW.camZ,
      )
      camera.lookAt(0, 0, 0)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.enablePan = false
      controls.minDistance = widthSpan * INITIAL_VIEW.minDistRatio
      controls.maxDistance = widthSpan * INITIAL_VIEW.maxDistRatio
      controls.minPolarAngle = 0.35
      controls.maxPolarAngle = Math.PI * 0.48
      controls.target.set(0, 0, 0.25)

      scene.add(new THREE.AmbientLight(t.ambient, 0.55))
      const key = new THREE.DirectionalLight(t.keyLight, 1.1)
      key.position.set(-6, -8, 14)
      scene.add(key)
      const rim = new THREE.PointLight(t.rimLight, 1.4, 80)
      rim.position.set(8, 6, 10)
      scene.add(rim)

      const mapGroup = new THREE.Group()
      scene.add(mapGroup)

      const shape = buildShapeFromPoints(flat, THREE)
      const extrude = new THREE.ExtrudeGeometry(shape, {
        depth: 0.55,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.045,
        bevelSegments: 2,
        steps: 1,
      })
      const terrain = new THREE.Mesh(extrude, [
        new THREE.MeshPhongMaterial({
          color: t.terrainTop,
          emissive: t.terrainEmissiveTop,
          shininess: 48,
        }),
        new THREE.MeshPhongMaterial({
          color: t.terrainSide,
          emissive: t.terrainEmissiveSide,
          shininess: 30,
        }),
      ])
      mapGroup.add(terrain)

      const topLine = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(flat.map((p) => new THREE.Vector3(p.x, p.y, 0.56))),
        new THREE.LineBasicMaterial({ color: t.edgeGlow, transparent: true, opacity: 0.95 }),
      )
      mapGroup.add(topLine)

      const grid = new THREE.GridHelper(widthSpan * 1.6, 24, t.gridPrimary, t.gridSecondary)
      grid.rotation.x = Math.PI / 2
      grid.position.z = -0.02
      mapGroup.add(grid)

      const posById = new Map<string, THREE.Vector3>()

      for (const node of nodes) {
        const pt = projectLngLat(node.lng, node.lat, center, scale, cosLat)
        const h = tierMarkerHeight(node.tier)
        const markerColor = t.markerByTier[node.tier] ?? t.markerByTier[0]
        const g = new THREE.Group()
        g.position.set(pt.x, pt.y, 0.58)

        for (let i = 0; i < 3; i++) {
          const r0 = MARKER.ringInner + i * MARKER.ringGap
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(r0, r0 + MARKER.ringWidth, 40),
            new THREE.MeshBasicMaterial({
              color: t.markerGlow,
              transparent: true,
              opacity: 0.22 - i * 0.05,
              side: THREE.DoubleSide,
            }),
          )
          g.add(ring)
        }

        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(MARKER.beamTopR, MARKER.beamBottomR, h * 0.75, 10, 1, true),
          new THREE.MeshBasicMaterial({
            color: markerColor,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
          }),
        )
        beam.position.z = h * 0.42
        g.add(beam)

        const diamond = new THREE.Mesh(
          new THREE.OctahedronGeometry(MARKER.diamondRadius, 0),
          new THREE.MeshPhongMaterial({
            color: markerColor,
            emissive: markerColor,
            emissiveIntensity: 0.32,
            shininess: 80,
            transparent: true,
            opacity: 0.95,
          }),
        )
        diamond.position.z = h
        g.add(diamond)

        const labelEl = document.createElement('div')
        if (variant === 'command') {
          labelEl.className = 'hx-command-map-label'
          labelEl.innerHTML = `<span class="hx-command-map-pin" aria-hidden="true"></span><span class="hx-command-map-name">${node.name}</span>`
        } else {
          labelEl.className = 'sc-map-label'
          labelEl.textContent = node.name
          labelEl.style.color = t.labelCss
          labelEl.style.borderColor = t.accentCss
        }
        const label = new CSS2DObject(labelEl)
        label.position.set(0.14, 0.05, h + 0.08)
        g.add(label)

        mapGroup.add(g)
        const tip = new THREE.Vector3(pt.x, pt.y, 0.58 + h)
        posById.set(node.id, tip)
      }

      const flowMat = new THREE.LineBasicMaterial({
        color: t.flowLine,
        transparent: true,
        opacity: MARKER.flowOpacity,
      })
      const pulses: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; phase: number }[] = []

      for (const link of links) {
        const start = posById.get(link.from)
        const end = posById.get(link.to)
        if (!start || !end) continue
        const mid = start.clone().add(end).multiplyScalar(0.5)
        mid.z += MARKER.flowArcLift
        const curve = new THREE.CatmullRomCurve3([start, mid, end])
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(MARKER.curveSegments)),
          flowMat,
        )
        mapGroup.add(line)

        const pulse = new THREE.Mesh(
          new THREE.SphereGeometry(MARKER.pulseRadius, 12, 12),
          new THREE.MeshBasicMaterial({ color: t.pulse }),
        )
        mapGroup.add(pulse)
        pulses.push({ mesh: pulse, curve, phase: Math.random() })
      }

      mapGroup.rotation.x = -Math.PI / 2
      mapGroup.position.z = 0.15
      mapGroup.scale.setScalar(INITIAL_VIEW.mapScale)

      const t0 = performance.now()
      const animate = (now: number) => {
        if (disposed) return
        frame = requestAnimationFrame(animate)
        const elapsed = (now - t0) / 1000
        mapGroup.rotation.z = Math.sin(elapsed * 0.08) * 0.02
        for (const p of pulses) {
          const u = (elapsed * 0.35 + p.phase) % 1
          p.mesh.position.copy(p.curve.getPoint(u))
        }
        controls.update()
        renderer.render(scene, camera)
        labelRenderer.render(scene, camera)
      }
      frame = requestAnimationFrame(animate)

      const onResize = () => {
        const w = mount.clientWidth
        const h = mount.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
        labelRenderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)
      cleanups.push(() => window.removeEventListener('resize', onResize))

      cleanups.push(() => {
        cancelAnimationFrame(frame)
        controls.dispose()
        renderer.dispose()
        extrude.dispose()
        mount.removeChild(renderer.domElement)
        mount.removeChild(labelRenderer.domElement)
      })
    }

    init(mount).catch(console.error)

    return () => {
      disposed = true
      cleanups.forEach((fn) => fn())
    }
  }, [themeId, region, variant])

  return (
    <div
      className={variant === 'command' ? 'command-map-canvas map-stage' : 'sc-map-canvas'}
      ref={mountRef}
      aria-label="3D 态势地图"
    />
  )
}
