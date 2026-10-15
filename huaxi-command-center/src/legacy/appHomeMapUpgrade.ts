/**
 * app.html 首页：隐藏旧 bundle WebGL，叠加 GLB 院区地图（无 React）
 */
import { mountMapScene } from '../smart-city/mountMapScene'

const OVERLAY_CLASS = 'hx-glb-map-overlay'

function hashPath() {
  return (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
}

function onGlbMapRoute() {
  const p = hashPath()
  return p === '/' || p === '' || p === '/map'
}

function isMapFullPage() {
  return document.body.classList.contains('hx-page-map-only')
}

function readRegion(): 'weiyuan' | 'dafang' {
  const sel = document.querySelector('.dashboard-center .region-switch button.selected')
  const label = sel?.textContent?.trim() ?? ''
  return label.includes('威远') ? 'weiyuan' : 'dafang'
}

function findMainMap(): HTMLElement | null {
  return (
    document.querySelector('main.dashboard.screen .main-map') ||
    document.querySelector('main.dashboard .main-map') ||
    document.querySelector('.dashboard-center .main-map')
  )
}

function takeoverCountyMap(mainMap: HTMLElement) {
  const county =
    (mainMap.querySelector('.county-map') as HTMLElement | null) ||
    (mainMap.querySelector('.map-stage')?.parentElement as HTMLElement | null)
  if (!county) return null
  if (getComputedStyle(county).position === 'static') county.style.position = 'relative'

  county.querySelectorAll('.map-stage').forEach((el) => {
    if (el.classList.contains(OVERLAY_CLASS)) return
    if (el.classList.contains('hx-glb-map-react-slot')) return
    el.remove()
  })
  county.querySelectorAll('canvas').forEach((canvas) => {
    if (canvas.closest(`.${OVERLAY_CLASS}`)) return
    canvas.remove()
  })
  county.querySelectorAll('.sc-map-label-layer').forEach((layer) => {
    if (layer.closest(`.${OVERLAY_CLASS}`)) return
    layer.remove()
  })
  return county
}

let disposeMap: (() => void) | null = null
let mountedKey: string | null = null
let retryTimer: ReturnType<typeof setInterval> | null = null
let mapPageActive: boolean | null = null
let mountObserverPaused = false

function teardown(_mainMap: HTMLElement | null) {
  disposeMap?.()
  disposeMap = null
  mountedKey = null
  document.querySelector(`.${OVERLAY_CLASS}`)?.remove()
}

function pulseResize() {
  ;[0, 80, 200, 450, 900, 1400].forEach((ms) => {
    setTimeout(() => {
      fitMapViewport()
      window.dispatchEvent(new Event('resize'))
    }, ms)
  })
}

/** 全屏时强制地图容器与 main-map 同尺寸，避免 canvas 缩在角落 */
function fitMapViewport() {
  const mainMap = findMainMap()
  const overlay = document.querySelector(`.${OVERLAY_CLASS}`) as HTMLElement | null
  if (!mainMap || !overlay) return
  const county = overlay.parentElement as HTMLElement | null
  const w = Math.max(mainMap.clientWidth, 320)
  const h = Math.max(mainMap.clientHeight, 280)
  if (county) {
    county.style.position = 'absolute'
    county.style.inset = '0'
    county.style.width = '100%'
    county.style.height = '100%'
    county.style.minHeight = `${h}px`
  }
  overlay.style.position = 'absolute'
  overlay.style.inset = '0'
  overlay.style.width = '100%'
  overlay.style.height = '100%'
  overlay.style.minHeight = `${h}px`
  const canvas = overlay.querySelector('canvas') as HTMLCanvasElement | null
  if (canvas) {
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
  }
}

function setMapDrawerOpen(open: boolean) {
  document.body.classList.toggle('hx-map-drawer-open', open)
  const bd = document.querySelector('.hx-map-drawer-backdrop') as HTMLElement | null
  if (bd) bd.hidden = !open
}

function syncMapPageChrome(mainMap: HTMLElement) {
  if (!isMapFullPage()) {
    setMapDrawerOpen(false)
    document.querySelector('.hx-map-page-chrome')?.remove()
    document.querySelector('.hx-map-drawer-backdrop')?.remove()
    return
  }

  if (!document.querySelector('.hx-map-drawer-backdrop')) {
    const backdrop = document.createElement('div')
    backdrop.className = 'hx-map-drawer-backdrop'
    backdrop.hidden = true
    backdrop.addEventListener('click', () => setMapDrawerOpen(false))
    document.body.appendChild(backdrop)
  }

  const host = (mainMap.closest('.dashboard-center') as HTMLElement | null) ?? mainMap
  if (host.querySelector('.hx-map-page-chrome')) return

  const chrome = document.createElement('div')
  chrome.className = 'hx-map-page-chrome'
  chrome.setAttribute('role', 'toolbar')
  chrome.innerHTML = `
    <div class="hx-map-chrome-left">
      <button type="button" class="hx-map-chrome-btn" data-action="menu">菜单</button>
      <button type="button" class="hx-map-chrome-btn" data-action="exit">返回概览</button>
    </div>
    <span class="hx-map-chrome-title">协作三维地图</span>
  `
  host.appendChild(chrome)

  chrome.querySelector('[data-action="menu"]')?.addEventListener('click', () => {
    setMapDrawerOpen(!document.body.classList.contains('hx-map-drawer-open'))
  })

  chrome.querySelector('[data-action="exit"]')?.addEventListener('click', (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    ;(window as Window & { hxMapPage?: { exit?: () => void } }).hxMapPage?.exit?.()
  })

  document.querySelector('.hx-sidebar')?.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement
    if (t.closest('a')) setMapDrawerOpen(false)
  })
}

function applyFullPageClasses(mainMap: HTMLElement) {
  const fullPage = isMapFullPage()
  mainMap.classList.toggle('hx-map-light-3d', true)
  mainMap.classList.toggle('hx-glb-map-host', true)
  mainMap.classList.toggle('hx-glb-map-host--full', fullPage)
  syncMapPageChrome(mainMap)
}

function mountGlbMap() {
  if (mountObserverPaused) return
  mountObserverPaused = true
  try {
    mountGlbMapInner()
  } finally {
    queueMicrotask(() => {
      mountObserverPaused = false
    })
  }
}

function reactMapSceneActive(mainMap: HTMLElement) {
  const slot = mainMap.querySelector('.county-map .command-map-canvas.map-stage')
  return !!(slot && slot.querySelector('canvas'))
}

function mountGlbMapInner() {
  if (!onGlbMapRoute()) {
    teardown(findMainMap())
    if (retryTimer) {
      clearInterval(retryTimer)
      retryTimer = null
    }
    return
  }

  const mainMap = findMainMap()
  if (!mainMap) return

  if (reactMapSceneActive(mainMap)) {
    teardown(mainMap)
    applyFullPageClasses(mainMap)
    pulseResize()
    return
  }

  const region = readRegion()
  const county = takeoverCountyMap(mainMap) ?? mainMap
  applyFullPageClasses(mainMap)

  let overlay = county.querySelector(`.${OVERLAY_CLASS}`) as HTMLElement | null
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.className = `${OVERLAY_CLASS} command-map-canvas`
    overlay.setAttribute('aria-label', '3D 院区地图')
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '20',
      width: '100%',
      height: '100%',
      minHeight: '240px',
      background: 'transparent',
    })
    county.appendChild(overlay)
  }

  const key = region
  const hasCanvas = !!overlay.querySelector('canvas')

  if (mountedKey === key && hasCanvas && disposeMap) {
    pulseResize()
    return
  }

  disposeMap?.()
  disposeMap = mountMapScene(overlay as HTMLDivElement, {
    themeId: 'light',
    region,
    variant: 'command',
    layout: isMapFullPage() ? 'fullscreen' : 'dashboard',
    useCampusGlb: false,
    campusDisplayScale: 1.18,
  })
  mountedKey = key
  pulseResize()
}

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null
  return () => {
    if (t) clearTimeout(t)
    t = setTimeout(fn, ms)
  }
}

function startRetryLoop() {
  if (retryTimer) return
  let n = 0
  retryTimer = setInterval(() => {
    n += 1
    mountGlbMap()
    const ok = document.querySelector(`.${OVERLAY_CLASS} canvas`)
    if (ok || n > 90) {
      clearInterval(retryTimer!)
      retryTimer = null
      if (ok) console.info('[hx-glb-map] 院区地图就绪')
    }
  }, 400)
}

function onMapPageToggle(active: boolean) {
  if (mapPageActive === active) return
  mapPageActive = active
  const mainMap = findMainMap()
  if (mainMap) applyFullPageClasses(mainMap)
  pulseResize()
  mountGlbMap()
}

function boot() {
  const run = debounce(mountGlbMap, 150)
  run()
  startRetryLoop()

  window.addEventListener('hashchange', () => {
    mountedKey = null
    setTimeout(run, 100)
    startRetryLoop()
  })

  window.addEventListener('hx-map-page', (ev) => {
    const active = !!(ev as CustomEvent<{ active?: boolean }>).detail?.active
    onMapPageToggle(active)
  })

  window.addEventListener('hx-glb-map-layout', () => {
    pulseResize()
  })

  document.querySelector('.dashboard-center')?.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement
    if (t.closest('.region-switch')) {
      mountedKey = null
      setTimeout(run, 120)
    }
  })

  const root = document.getElementById('root')
  if (root) {
    new MutationObserver(() => {
      if (mountObserverPaused) return
      if (!findMainMap()) return
      run()
    }).observe(root, { childList: true, subtree: true })
  }

  window.addEventListener('resize', debounce(mountGlbMap, 200))
}

boot()
