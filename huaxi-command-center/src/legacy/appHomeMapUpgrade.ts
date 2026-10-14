/**
 * app.html 首页：隐藏旧 bundle WebGL，叠加 GLB 院区地图（无 React）
 */
import { mountMapScene } from '../smart-city/mountMapScene'

const OVERLAY_CLASS = 'hx-glb-map-overlay'

function onHomeRoute() {
  const hash = (location.hash.replace(/^#/, '').split('?')[0] || '/').replace(/\/$/, '') || '/'
  return hash === '/' || hash === ''
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

/** 移除旧 bundle 地图 DOM，避免双 Canvas 叠在一起「楼在地图外」 */
function takeoverCountyMap(mainMap: HTMLElement) {
  const county =
    (mainMap.querySelector('.county-map') as HTMLElement | null) ||
    (mainMap.querySelector('.map-stage')?.parentElement as HTMLElement | null)
  if (!county) return null
  if (getComputedStyle(county).position === 'static') county.style.position = 'relative'

  county.querySelectorAll('.map-stage').forEach((el) => {
    if (el.classList.contains(OVERLAY_CLASS)) return
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
let mountedRegion: 'weiyuan' | 'dafang' | null = null
let retryTimer: ReturnType<typeof setInterval> | null = null

function teardown(mainMap: HTMLElement | null) {
  disposeMap?.()
  disposeMap = null
  mountedRegion = null
  document.querySelector(`.${OVERLAY_CLASS}`)?.remove()
}

function overlayReady(overlay: HTMLElement) {
  const canvas = overlay.querySelector('canvas')
  if (!canvas) return false
  return canvas.clientWidth > 40 && canvas.clientHeight > 40
}

function mountGlbMap() {
  if (!onHomeRoute()) {
    teardown(findMainMap())
    if (retryTimer) {
      clearInterval(retryTimer)
      retryTimer = null
    }
    return
  }

  const mainMap = findMainMap()
  if (!mainMap) return

  const region = readRegion()
  const county = takeoverCountyMap(mainMap) ?? mainMap

  let overlay = county.querySelector(`.${OVERLAY_CLASS}`) as HTMLElement | null
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.className = `${OVERLAY_CLASS} command-map-canvas map-stage`
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

  if (mountedRegion === region && overlayReady(overlay)) return

  disposeMap?.()
  disposeMap = mountMapScene(overlay as HTMLDivElement, {
    themeId: 'light',
    region,
    variant: 'command',
    campusDisplayScale: 1.0,
  })
  mountedRegion = region

  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'))
  })
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

function boot() {
  const run = debounce(mountGlbMap, 150)
  run()
  startRetryLoop()

  window.addEventListener('hashchange', () => {
    mountedRegion = null
    setTimeout(run, 100)
    startRetryLoop()
  })

  document.querySelector('.dashboard-center')?.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement
    if (t.closest('.region-switch')) {
      mountedRegion = null
      setTimeout(run, 120)
    }
  })

  const root = document.getElementById('root')
  if (root) {
    new MutationObserver(run).observe(root, { childList: true, subtree: true })
  }

  window.addEventListener('resize', debounce(mountGlbMap, 200))
}

boot()
