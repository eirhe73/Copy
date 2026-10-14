import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { getMapTheme } from '../mapTheme'
import type { GeoJson } from '../smart-city/geo'
import {
  buildShapeFromPoints,
  getRings,
  projectLngLat,
  projectRing,
  ringBounds,
} from '../smart-city/geo'
import type { Hospital3D } from './types'

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

const TIER_COLOR = [
  0x38bdf8, // 县级
  0x22d3ee, // 乡镇
  0x64748b, // 村室
  0xa78bfa, // 协作上级
] as const

const TIER_BUILDING = [
  { floors: 3, scale: 1.15 },
  { floors: 2, scale: 0.95 },
  { floors: 1, scale: 0.75 },
  { floors: 3, scale: 1.05 },
] as const

type HospitalMap3DProps = {
  region: 'weiyuan' | 'dafang'
  hospitals: Hospital3D[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function HospitalMap3D({ region, hospitals, selectedId, onSelect }: HospitalMap3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const stateRef = useRef<{
    hospitalGroups: Map<string, THREE.Group>
    worldById: Map<string, THREE.Vector3>
    widthSpan: number
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    mapGroup: THREE.Group
  } | null>(null)

  useEffect(() => {
    const mountEl = mountRef.current
    if (!mountEl || !hospitals.length) return

    const theme = getMapTheme('cyber')
    const t = theme.three
    let disposed = false
    let frame = 0
    const cleanups: (() => void)[] = []

    async function init(container: HTMLDivElement) {
      const geoRes = await fetch(`/maps/${region}.json`)
      if (!geoRes.ok) throw new Error('地图加载失败')
      const geo = (await geoRes.json()) as GeoJson
      if (disposed) return

      const ring = getRings(geo)[0]
      const bounds = ringBounds(ring)
      const scale = INITIAL_VIEW.geoScale / (bounds.maxLat - bounds.minLat)
      const cosLat = Math.cos(bounds.centerLat * (Math.PI / 180))
      const center = { lng: bounds.centerLng, lat: bounds.centerLat }
      const flat = projectRing(ring, center, scale, cosLat)
      const widthSpan = (bounds.maxLng - bounds.minLng) * scale * cosLat

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(container.clientWidth, container.clientHeight)
      container.appendChild(renderer.domElement)

      const labelRenderer = new CSS2DRenderer()
      labelRenderer.setSize(container.clientWidth, container.clientHeight)
      labelRenderer.domElement.className = 'sc-map-label-layer'
      labelRenderer.domElement.style.pointerEvents = 'none'
      container.appendChild(labelRenderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        INITIAL_VIEW.fov,
        container.clientWidth / container.clientHeight,
        0.1,
        200,
      )
      camera.position.set(
        -widthSpan * INITIAL_VIEW.camX,
        -widthSpan * INITIAL_VIEW.camY,
        widthSpan * INITIAL_VIEW.camZ,
      )

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
      terrain.userData = { kind: 'terrain' }
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

      const hospitalGroups = new Map<string, THREE.Group>()
      const worldById = new Map<string, THREE.Vector3>()
      const pickables: THREE.Object3D[] = []

      for (const h of hospitals) {
        const tier = Math.min(3, Math.max(0, h.tier)) as 0 | 1 | 2 | 3
        const pt = projectLngLat(h.lng, h.lat, center, scale, cosLat)
        const spec = TIER_BUILDING[tier]
        const color = TIER_COLOR[tier]
        const g = new THREE.Group()
        g.position.set(pt.x, pt.y, 0.58)
        g.userData = { kind: 'hospital', hospitalId: h.id }

        const baseRing = new THREE.Mesh(
          new THREE.RingGeometry(0.06, 0.095, 32),
          new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
          }),
        )
        g.add(baseRing)

        const floorH = 0.12 * spec.scale
        const baseW = 0.07 * spec.scale
        for (let f = 0; f < spec.floors; f++) {
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(baseW, baseW * 0.85, floorH),
            new THREE.MeshPhongMaterial({
              color,
              emissive: color,
              emissiveIntensity: 0.15,
              shininess: 60,
            }),
          )
          box.position.z = floorH * 0.5 + f * floorH * 0.92
          box.userData = { kind: 'hospital', hospitalId: h.id }
          g.add(box)
          pickables.push(box)
        }

        const topZ = spec.floors * floorH * 0.92 + 0.08
        const labelEl = document.createElement('div')
        labelEl.className = 'hx-hospital-map-label'
        labelEl.dataset.hospitalId = h.id
        labelEl.textContent = h.shortName || h.name
        const label = new CSS2DObject(labelEl)
        label.position.set(0, 0, topZ)
        g.add(label)

        mapGroup.add(g)
        hospitalGroups.set(h.id, g)
        const world = new THREE.Vector3(pt.x, pt.y, 0.58 + topZ)
        worldById.set(h.id, world)
      }

      mapGroup.rotation.x = -Math.PI / 2
      mapGroup.position.z = 0.15
      mapGroup.scale.setScalar(INITIAL_VIEW.mapScale)

      stateRef.current = {
        hospitalGroups,
        worldById,
        widthSpan,
        camera,
        controls,
        mapGroup,
      }

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()

      const onPointerMove = (ev: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(pickables, false)
        const tip = tooltipRef.current
        if (hits.length) {
          const id = hits[0].object.userData.hospitalId as string
          const h = hospitals.find((x) => x.id === id)
          if (tip && h) {
            tip.textContent = h.name
            tip.classList.add('visible')
            tip.style.left = `${ev.clientX - rect.left}px`
            tip.style.top = `${ev.clientY - rect.top}px`
          }
          renderer.domElement.style.cursor = 'pointer'
        } else {
          tip?.classList.remove('visible')
          renderer.domElement.style.cursor = 'default'
        }
      }

      const onClick = (ev: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(pickables, false)
        if (hits.length) {
          const id = hits[0].object.userData.hospitalId as string
          onSelectRef.current(id)
        } else {
          onSelectRef.current(null)
        }
      }

      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') onSelectRef.current(null)
      }

      renderer.domElement.addEventListener('pointermove', onPointerMove)
      renderer.domElement.addEventListener('click', onClick)
      window.addEventListener('keydown', onKey)
      cleanups.push(() => {
        renderer.domElement.removeEventListener('pointermove', onPointerMove)
        renderer.domElement.removeEventListener('click', onClick)
        window.removeEventListener('keydown', onKey)
      })

      const t0 = performance.now()
      const animate = (now: number) => {
        if (disposed) return
        frame = requestAnimationFrame(animate)
        const elapsed = (now - t0) / 1000
        mapGroup.rotation.z = Math.sin(elapsed * 0.06) * 0.015
        for (const [id, grp] of hospitalGroups) {
          const pulse = id === selectedRef.current ? 1 + Math.sin(elapsed * 4) * 0.04 : 1
          grp.scale.setScalar(pulse)
        }
        controls.update()
        renderer.render(scene, camera)
        labelRenderer.render(scene, camera)
      }
      frame = requestAnimationFrame(animate)

      const onResize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
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
        container.removeChild(renderer.domElement)
        container.removeChild(labelRenderer.domElement)
        stateRef.current = null
      })
    }

    init(mountEl).catch(console.error)
    return () => {
      disposed = true
      cleanups.forEach((fn) => fn())
    }
  }, [region, hospitals])

  useEffect(() => {
    const st = stateRef.current
    if (!st) return
    const { hospitalGroups, worldById, widthSpan, camera, controls } = st

    for (const [id, grp] of hospitalGroups) {
      const selected = id === selectedId
      const dimmed = selectedId != null && !selected
      grp.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh) || !obj.material) return
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) {
          if (!(m instanceof THREE.MeshPhongMaterial)) continue
          m.emissiveIntensity = selected ? 0.55 : dimmed ? 0.05 : 0.15
          m.opacity = dimmed ? 0.45 : 1
          m.transparent = dimmed
        }
      })
      const label = grp.children.find(
        (c) => c instanceof CSS2DObject,
      ) as CSS2DObject | undefined
      const el = label?.element as HTMLElement | undefined
      if (el) el.classList.toggle('selected', selected)
    }

    if (selectedId) {
      const local = worldById.get(selectedId)
      if (local) {
        const target = local.clone().applyMatrix4(st.mapGroup.matrixWorld)
        const dist = widthSpan * 0.85
        const from = camera.position.clone()
        const toCam = new THREE.Vector3(target.x - dist * 0.35, target.y - dist * 0.25, target.z + dist * 0.55)
        let t = 0
        const startTarget = controls.target.clone()
        const step = () => {
          t += 0.06
          const k = Math.min(1, t)
          const ease = 1 - (1 - k) ** 3
          camera.position.lerpVectors(from, toCam, ease)
          controls.target.lerpVectors(startTarget, target, ease)
          if (k < 1) requestAnimationFrame(step)
        }
        step()
      }
    }
  }, [selectedId])

  return (
    <div className="hx-map-3d-canvas-wrap">
      <div className="hx-map-3d-canvas" ref={mountRef} aria-label="3D 医院地图" />
      <div className="hx-map-3d-tooltip" ref={tooltipRef} />
    </div>
  )
}
